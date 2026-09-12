/**
 * SMS rule engine: sender match + regex named groups + capture map → fields.
 * Includes a multi-locale heuristic fallback when bank-specific rules miss.
 */

import {isCurrencyCode, getCurrency, type CurrencyCode} from '../money/Money';

import {cleanMerchant} from './merchantCleanup';

export type SmsCaptureField =
  | 'amount'
  | 'currency'
  | 'merchant'
  | 'type'
  | 'cardLast4'
  | 'direction'
  | 'reference'
  | 'occurredAt'
  | 'fee'
  | 'balance';

/** Maps transaction field → named capture group in body_regex. */
export type SmsCaptureMap = Partial<Record<SmsCaptureField, string>>;

export type SmsRule = {
  id: string;
  name: string;
  senderPattern: string;
  bodyRegex: string;
  captureMap: SmsCaptureMap;
  priority: number;
  enabled: boolean;
  defaultAccountId?: string | null;
  defaultCategoryId?: string | null;
};

export type SmsClassificationLabel =
  | 'non_transaction'
  | 'expense'
  | 'income'
  | 'transfer_in'
  | 'transfer_out'
  | 'internal_transfer'
  | 'ambiguous';

export type SmsParsedFields = {
  amountMinor: number | null;
  currency: string | null;
  merchant: string | null;
  type: 'expense' | 'income' | 'transfer' | null;
  cardLast4: string | null;
  direction: string | null;
  rawGroups: Record<string, string>;
  classification?: SmsClassificationLabel | null;
  reference?: string | null;
  occurredAtHint?: string | null;
  feeAmountMinor?: number | null;
  balanceAmountMinor?: number | null;
  matchScore?: number;
};

export type SmsMatchResult = {
  rule: SmsRule;
  fields: SmsParsedFields;
};

export type RawSms = {
  sender: string;
  body: string;
  receivedAt: string;
};

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC = '۰۱۲۳۴۵۶۷۸۹';

const CURRENCY_ALIASES: Record<string, CurrencyCode> = {
  EGP: 'EGP',
  LE: 'EGP',
  'E£': 'EGP',
  'ج.م': 'EGP',
  جنية: 'EGP',
  جنيه: 'EGP',
  USD: 'USD',
  'US$': 'USD',
  $: 'USD',
  EUR: 'EUR',
  '€': 'EUR',
  GBP: 'GBP',
  '£': 'GBP',
  SAR: 'SAR',
  SR: 'SAR',
  'ر.س': 'SAR',
  ريال: 'SAR',
  AED: 'AED',
  DH: 'AED',
  DHS: 'AED',
  'د.إ': 'AED',
  JPY: 'JPY',
  '¥': 'JPY',
  KWD: 'KWD',
  KD: 'KWD',
  'د.ك': 'KWD',
  INR: 'INR',
  RS: 'INR',
  'RS.': 'INR',
  '₹': 'INR',
};

/** Synthetic rule id used when heuristic extraction succeeds without a DB rule. */
export const HEURISTIC_RULE_ID = '__heuristic__';

export const HEURISTIC_RULE: SmsRule = {
  id: HEURISTIC_RULE_ID,
  name: 'Generic amount detector',
  senderPattern: '/.*/i',
  bodyRegex: '.*',
  captureMap: {amount: 'amount'},
  priority: 10_000,
  enabled: true,
};

export function parseCaptureMapJson(json: string): SmsCaptureMap {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const out: SmsCaptureMap = {};
    const obj = parsed as Record<string, unknown>;
    for (const key of [
      'amount',
      'currency',
      'merchant',
      'type',
      'cardLast4',
      'direction',
      'reference',
      'occurredAt',
      'fee',
      'balance',
    ] as const) {
      const value = obj[key];
      if (typeof value === 'string' && value.length > 0) {
        out[key] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeCaptureMap(map: SmsCaptureMap): string {
  return JSON.stringify(map);
}

/** Validate a body regex before saving a rule. */
export function validateBodyRegex(source: string): {ok: true} | {ok: false; error: string} {
  const trimmed = source.trim();
  if (!trimmed) {
    return {ok: false, error: 'Regex is empty'};
  }
  if (trimmed.length > 800) {
    return {ok: false, error: 'Regex is too long (max 800)'};
  }
  try {
    // eslint-disable-next-line no-new
    new RegExp(trimmed, 'i');
  } catch (err) {
    return {ok: false, error: err instanceof Error ? err.message : 'Invalid regex'};
  }
  if (!/\(\?<[A-Za-z]/.test(trimmed)) {
    return {ok: false, error: 'Named capture groups required (e.g. (?<amount>…))'};
  }
  return {ok: true};
}

/** Normalize Arabic-Indic / Eastern Arabic digits and whitespace. */
export function normalizeSmsText(raw: string): string {
  let out = '';
  for (const ch of raw) {
    const western =
      ARABIC_INDIC.indexOf(ch) >= 0
        ? String(ARABIC_INDIC.indexOf(ch))
        : EASTERN_ARABIC.indexOf(ch) >= 0
          ? String(EASTERN_ARABIC.indexOf(ch))
          : ch;
    out += western;
  }
  return out.replace(/[\u00A0\u202F\u2009]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalizeCurrencyCode(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const upper = trimmed.toUpperCase();
  if (CURRENCY_ALIASES[upper]) {
    return CURRENCY_ALIASES[upper];
  }
  if (CURRENCY_ALIASES[trimmed]) {
    return CURRENCY_ALIASES[trimmed];
  }
  if (/^[A-Z]{3}$/.test(upper) && isCurrencyCode(upper)) {
    return upper;
  }
  return upper.length <= 8 ? upper : null;
}

/** Sender pattern: plain substring (case-insensitive) or /regex/i. */
export function senderMatches(sender: string, pattern: string): boolean {
  const trimmed = pattern.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.startsWith('/') && trimmed.lastIndexOf('/') > 0) {
    const last = trimmed.lastIndexOf('/');
    const source = trimmed.slice(1, last);
    const flags = trimmed.slice(last + 1) || 'i';
    try {
      return new RegExp(source, flags).test(sender);
    } catch {
      return false;
    }
  }
  return sender.toUpperCase().includes(trimmed.toUpperCase());
}

export function parseAmountToMinor(
  raw: string,
  currencyHint: string | null,
): number | null {
  const normalizedDigits = normalizeSmsText(raw);
  // Times / ratios use colon — never money amounts (e.g. "2:46", "14:30").
  if (/:/.test(normalizedDigits)) {
    return null;
  }
  // Keep digits, separators, and minus; drop currency letters/symbols.
  const cleaned = normalizedDigits.replace(/[^\d.,\s-]/g, '').replace(/\s/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === ',') {
    return null;
  }

  let normalized = cleaned;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (lastComma >= 0) {
    const parts = cleaned.split(',');
    const frac = parts[1] ?? '';
    normalized =
      parts.length === 2 && frac.length > 0 && frac.length <= 3
        ? `${parts[0]}.${frac}`
        : cleaned.replace(/,/g, '');
  } else if (lastDot >= 0) {
    const parts = cleaned.split('.');
    const frac = parts[1] ?? '';
    // 1.234.567 European thousands without decimal comma
    if (parts.length > 2) {
      normalized = cleaned.replace(/\./g, '');
    } else if (frac.length === 3 && parts[0] && parts[0].length <= 3) {
      // Ambiguous 1.234 — treat as thousands when no other cue
      normalized = cleaned.replace(/\./g, '');
    }
  }

  const major = Number(normalized);
  if (!Number.isFinite(major) || major === 0) {
    return null;
  }

  const exponent = currencyExponent(currencyHint);
  return Math.round(Math.abs(major) * 10 ** exponent);
}

function currencyExponent(code: string | null): number {
  const normalized = normalizeCurrencyCode(code);
  if (normalized && isCurrencyCode(normalized)) {
    return getCurrency(normalized).exponent;
  }
  return 2;
}

/** Non-money SMS that often contain numbers (times, OTPs, phones). */
export function isNonTransactionalSms(body: string): boolean {
  const hay = normalizeSmsText(body).toLowerCase();
  return (
    /\b(missed\s*calls?|tried\s+to\s+call|last\s+missed|incoming\s+call|outgoing\s+call|truecaller|call\s+reminder|voicemail)\b/.test(
      hay,
    ) ||
    /\b(otp|one[-\s]?time\s*(?:password|code|pin)|verification\s*code|auth(?:entication)?\s*code|security\s*code|do\s+not\s+share)\b/.test(
      hay,
    ) ||
    /مكالمة\s*فائتة|اتصال\s*فائت|مكالمات?\s*فائتة|حاول(?:ت)?\s*(?:ان\s*)?الاتصال|لم\s*ير(?:د|د)|رسالة\s*صوتية/.test(
      hay,
    ) ||
    /رمز\s*التحقق|كود\s*التحقق|رمز\s*سري|كلمة\s*(?:المرور|السر)\s*لمرة|لا\s*تشارك/.test(hay)
  );
}

/** Money-movement language (not balance-only / not random numbers). */
export function hasTransactionalSignal(body: string): boolean {
  const hay = normalizeSmsText(body).toLowerCase();
  return (
    /\b(purchase|paid|payment|debit(?:ed)?|credit(?:ed)?|deposit(?:ed)?|withdraw(?:al)?|atm|pos|spent|charged|transfer|trf|salary|refund|cashback|txn|transaction|instapay|ipn|upi|imps|neft|wire|amount|amt|value|total|fee|egp|usd|eur|gbp|sar|aed|kwd|inr|le)\b/.test(
      hay,
    ) ||
    /خصم|شراء|مبلغ|قيمة|تحويل|حولت|ايداع|إيداع|سحب|راتب|مسترد|استرداد|عملية|مدفوع|جنيه|ريال|درهم|د\.إ|ج\.م/.test(
      hay,
    ) ||
    /[$€£¥₹]/.test(hay)
  );
}

/** Balance / statement noise without a clear debit/credit event. */
export function isBalanceOnlySms(body: string): boolean {
  const hay = normalizeSmsText(body).toLowerCase();
  const hasBalance =
    /\b(balance|available\s+bal(?:ance)?|avl\s*bal|ledger\s*bal)\b/.test(hay) ||
    /رصيد(?:\s*متاح)?|الرصيد/.test(hay);
  if (!hasBalance) {
    return false;
  }
  return (
    !/\b(purchase|paid|payment|debit|credit|withdraw|atm|pos|spent|charged|transfer|salary|refund|fee|txn|transaction)\b/.test(
      hay,
    ) && !/خصم|شراء|تحويل|ايداع|إيداع|سحب|راتب|مسترد|عملية|مدفوع/.test(hay)
  );
}

/** Credit-limit / promo / marketing SMS — never ledger entries. */
export function isPromoOrLimitSms(body: string): boolean {
  const hay = normalizeSmsText(body).toLowerCase();
  return (
    /\b(credit\s+limit|available\s+limit|pre-?approved|loan\s+offer|cashback\s+offer|discount\s+code|promo(?:tion)?|unsubscribe|marketing)\b/.test(
      hay,
    ) || /حد\s*ائتمان|عرض\s*قرض|عرض\s*ترويجي|كود\s*خصم/.test(hay)
  );
}

export function extractReference(body: string): string | null {
  const text = normalizeSmsText(body);
  const m =
    /\b(?:ref(?:erence)?|txn(?:\s*id)?|rrn|auth(?:\s*code)?|id)[:#\s-]*([A-Z0-9-]{4,24})\b/i.exec(
      text,
    );
  return m?.[1] ?? null;
}

/** Best-effort embedded date (ISO date string or null). */
export function extractOccurredAtHint(body: string): string | null {
  const text = normalizeSmsText(body);
  const iso = /\b(20\d{2}-\d{2}-\d{2})\b/.exec(text);
  if (iso?.[1]) {
    return `${iso[1]}T12:00:00.000Z`;
  }
  const dmy =
    /\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d{2})\b/.exec(text) ??
    /\bon\s+(\d{1,2})-([A-Za-z]{3})(?:-(20\d{2}))?\b/i.exec(text);
  if (dmy) {
    // Keep as hint text only when unambiguous ISO wasn't found.
    return null;
  }
  return null;
}

function inferType(
  rawType: string | null,
  direction: string | null,
  body: string,
): 'expense' | 'income' | 'transfer' | null {
  const hay = normalizeSmsText(`${rawType ?? ''} ${direction ?? ''} ${body}`).toLowerCase();

  if (
    /\b(between\s+your\s+accounts|internal\s+transfer|own\s+account)\b/.test(hay) ||
    /تحويل\s*(?:بين|داخلي)|من\s*حسابك\s*(?:الى|إلى)\s*حسابك/.test(hay)
  ) {
    return 'transfer';
  }

  // Strong OUTGOING transfer
  if (
    /\b(sent\s+to|you\s+sent|transfer(?:red)?\s+to|outgoing\s+transfer|funds\s+sent|money\s+sent)\b/.test(
      hay,
    ) ||
    /(?:تم\s+)?تحويل(?:ت)?\s*(?:مبلغ\s*)?(?:بنجاح\s*)?(?:الى|إلى)/.test(hay) ||
    /تحويل\s*صادر|حولت\s*(?:الى|إلى)/.test(hay)
  ) {
    return 'expense';
  }

  // Strong INCOMING transfer
  if (
    /\b(received\s+(?:a\s+)?(?:transfer|payment|instapay|ipn|money|funds|amount)|(?:transfer|payment|instapay|ipn|money|funds)\s+received|incoming\s+transfer|you\s+received|received\s+from|has\s+sent\s+you|sent\s+you)\b/.test(
      hay,
    ) ||
    /تم\s+استلام|استلمت|تحويل\s*وارد|حول\s+(?:إليك|لك|لحسابك)/.test(hay)
  ) {
    return 'income';
  }

  if (
    /\b(instapay|ipn|upi|imps|neft|swift)\b/.test(hay) ||
    /انستا\s*باي|إنستاباي|انستاباي/.test(hay)
  ) {
    const clearlyIn =
      /\b(you\s+received|received\s+from|incoming\s+transfer|credited\s+to\s+your|has\s+sent\s+you|sent\s+you)\b/.test(
        hay,
      ) || /تم\s+استلام|استلمت|حول\s+(?:إليك|لك)/.test(hay);
    if (clearlyIn) {
      return 'income';
    }
    if (
      /\b(to|sent|paid|payment|outgoing|debited)\b/.test(hay) ||
      /الى|إلى|خصم/.test(hay)
    ) {
      return 'expense';
    }
  }

  if (/\b(transfer|trf|wire)\b/.test(hay) || /تحويل/.test(hay)) {
    const hasFrom = /\bfrom\b/.test(hay) || /(?:^|[\s])من[\s]/.test(hay);
    const hasTo = /\bto\b/.test(hay) || /(?:الى|إلى)/.test(hay);
    if (hasFrom && !hasTo) {
      return 'income';
    }
    if (hasTo && !hasFrom) {
      return 'expense';
    }
    return 'transfer';
  }

  // Expense before bare "received" so "payment … received confirmation" stays expense.
  if (
    /\b(debit|purchase|paid|withdrawal|atm|pos|spent|payment|charged|txn)\b/.test(hay) ||
    /خصم|شراء|مدفوع|سحب|عملية|مصروف/.test(hay)
  ) {
    return 'expense';
  }

  if (
    /\b(credit(?:ed)?|deposit(?:ed)?|salary|refund|cashback|received\s+from|incoming)\b/.test(
      hay,
    ) ||
    /ايداع|إيداع|راتب|مسترد|استرداد|تم اضافة|تم إضافة|رصيد دائن/.test(hay)
  ) {
    return 'income';
  }

  if (rawType) {
    const t = rawType.toLowerCase();
    if (t === 'income' || t === 'expense' || t === 'transfer') {
      if (t === 'transfer') {
        const dir = (direction ?? '').toLowerCase();
        if (/(in|incoming|credit|receive|وارد)/.test(dir)) {
          return 'income';
        }
        if (/(out|outgoing|debit|send|صادر)/.test(dir)) {
          return 'expense';
        }
        return 'transfer';
      }
      return t;
    }
  }

  return hasTransactionalSignal(body) ? 'expense' : null;
}

/** Replace clock times so "14:30" / "2:46" cannot be read as money. */
function maskNonAmountNoise(text: string): string {
  return text
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(/\b(?:ref|reference|txn|id|rrn|auth)[:#\s-]*[A-Z0-9-]{4,}\b/gi, ' ')
    .replace(/\b(?:card|ending|xx+|\*{2,})\s*[*:#-]?\s*\d{4}\b/gi, ' ')
    .replace(/\b(?:\+?\d[\d\s-]{8,}\d)\b/g, ' ');
}

const MIN_HEURISTIC_SCORE = 5;

function detectCurrencyInText(body: string): string | null {
  const normalized = normalizeSmsText(body);
  // Prefer ISO codes.
  const iso = /\b([A-Z]{3})\b/.exec(normalized);
  if (iso?.[1] && normalizeCurrencyCode(iso[1])) {
    const code = normalizeCurrencyCode(iso[1]);
    if (code && isCurrencyCode(code)) {
      return code;
    }
  }
  // Symbols / local aliases
  for (const alias of Object.keys(CURRENCY_ALIASES)) {
    if (alias.length === 1) {
      if (normalized.includes(alias)) {
        return CURRENCY_ALIASES[alias] ?? null;
      }
    } else if (new RegExp(`(?:^|\\s|[\\(])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$|[\\)])`, 'i').test(normalized)) {
      return CURRENCY_ALIASES[alias.toUpperCase()] ?? CURRENCY_ALIASES[alias] ?? null;
    }
  }
  return null;
}

/**
 * Best-effort amount extraction for real bank SMS across locales.
 * Requires money cues — ignores times, OTPs, missed calls, and bare codes.
 */
export function extractHeuristicAmount(
  body: string,
  currencyHint: string | null = null,
): {
  amountMinor: number;
  currency: string | null;
  raw: string;
  candidates: {raw: string; amountMinor: number; score: number}[];
} | null {
  if (isNonTransactionalSms(body) || isBalanceOnlySms(body) || isPromoOrLimitSms(body)) {
    return null;
  }
  if (!hasTransactionalSignal(body) && !currencyHint) {
    const early = normalizeSmsText(body);
    if (!detectCurrencyInText(early)) {
      return null;
    }
  }

  const original = normalizeSmsText(body);
  const text = maskNonAmountNoise(original);
  const currency = normalizeCurrencyCode(currencyHint) ?? detectCurrencyNearAmount(original);

  const amountToken =
    /(?<![A-Z0-9])((?:\d{1,3}(?:[ ,.\u00A0]\d{3})+|\d+)(?:[.,]\d{1,3})?)(?!\d)/g;

  const candidates: {raw: string; amountMinor: number; score: number}[] = [];
  let m: RegExpExecArray | null;
  while ((m = amountToken.exec(text)) != null) {
    const raw = m[1];
    if (!raw) {
      continue;
    }
    if (/^(19|20)\d{2}$/.test(raw.replace(/\D/g, ''))) {
      continue;
    }
    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly.length >= 10) {
      continue;
    }
    if (
      digitsOnly.length >= 5 &&
      digitsOnly.length <= 8 &&
      !/[.,\s]/.test(raw) &&
      currency == null
    ) {
      continue;
    }
    const amountMinor = parseAmountToMinor(raw, currency);
    if (amountMinor == null || amountMinor <= 0) {
      continue;
    }
    const idx = m.index;
    const window = text.slice(Math.max(0, idx - 28), Math.min(text.length, idx + raw.length + 28));
    let score = 0;
    if (
      /(EGP|USD|EUR|GBP|SAR|AED|KWD|JPY|INR|LE|E£|SR|KD|Rs\.?|₹|\$|€|£|ر\.س|د\.إ|جنيه|ريال|درهم)/i.test(
        window,
      )
    ) {
      score += 5;
    }
    if (
      /(amount|amt|value|sum|total|debit|credit|paid|purchase|spent|withdraw|payment|خصم|مبلغ|قيمة|شراء|تحويل)/i.test(
        window,
      )
    ) {
      score += 4;
    }
    if (/\b(balance|available|avl|رصيد|limit|fee|رسوم)\b/i.test(window)) {
      score -= 4;
    }
    if (amountMinor >= 100) {
      score += 1;
    }
    if (/[.,]\d{2}$/.test(raw)) {
      score += 2;
    }
    if (score < MIN_HEURISTIC_SCORE) {
      continue;
    }
    candidates.push({raw, amountMinor, score});
  }

  if (candidates.length === 0) {
    return null;
  }
  candidates.sort((a, b) => b.score - a.score || b.amountMinor - a.amountMinor);
  const best = candidates[0];
  if (!best) {
    return null;
  }
  return {amountMinor: best.amountMinor, currency, raw: best.raw, candidates};
}

/** Prefer currency adjacent to a money amount; deprioritize bare `$`. */
function detectCurrencyNearAmount(body: string): string | null {
  const normalized = normalizeSmsText(body);
  const nearIso =
    /\b(\d{1,3}(?:[ ,]\d{3})*(?:[.,]\d{1,3})?|\d+(?:[.,]\d{1,3})?)\s*(EGP|USD|EUR|GBP|SAR|AED|KWD|JPY|INR|LE|E£|SR|KD|Rs\.?)\b/i.exec(
      normalized,
    ) ??
    /\b(EGP|USD|EUR|GBP|SAR|AED|KWD|JPY|INR|LE|E£|SR|KD|Rs\.?)\s*(\d{1,3}(?:[ ,]\d{3})*(?:[.,]\d{1,3})?|\d+(?:[.,]\d{1,3})?)\b/i.exec(
      normalized,
    );
  if (nearIso) {
    const a = nearIso[1] ?? '';
    const b = nearIso[2] ?? '';
    const code = normalizeCurrencyCode(
      /^(EGP|USD|EUR|GBP|SAR|AED|KWD|JPY|INR|LE|E£|SR|KD|Rs\.?)$/i.test(a) ? a : b,
    );
    if (code && isCurrencyCode(code)) {
      return code;
    }
  }
  for (const alias of ['جنيه', 'ريال', 'درهم', 'د.إ', 'ج.م', '₹', '€', '£', 'E£']) {
    if (normalized.includes(alias)) {
      return CURRENCY_ALIASES[alias] ?? normalizeCurrencyCode(alias);
    }
  }
  // Bare `$` only when no other currency cue exists and amount is adjacent.
  if (/\$\s*\d|\d\s*\$/.test(normalized) && !/\b(EGP|LE|SAR|AED|EUR|GBP)\b/i.test(normalized)) {
    return 'USD';
  }
  return detectCurrencyInText(normalized);
}

function extractHeuristicMerchant(body: string): string | null {
  const text = normalizeSmsText(body);
  const patterns = [
    /(?:at|@|to|from|merchant|pos|with)\s+([A-Za-z0-9][A-Za-z0-9 .&'*_-]{1,50})/i,
    /(?:لدى|عند|الى|إلى|من)\s+([\u0600-\u06FFA-Za-z0-9][\u0600-\u06FFA-Za-z0-9 .&'*_-]{1,50})/,
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m?.[1]) {
      const cleaned = cleanMerchant(m[1]);
      if (cleaned && cleaned !== 'Unknown merchant') {
        return cleaned;
      }
    }
  }
  return null;
}

function extractCardLast4(body: string): string | null {
  const m =
    /(?:card|ending|xx+|x{2,}|\*{2,}|\u2022{2,}|بطاقة|بطاقة رقم)\s*[*:#-]?\s*(\d{4})\b/i.exec(
      normalizeSmsText(body),
    );
  return m?.[1] ?? null;
}

/** Heuristic parse used when no DB rule matches or amount is missing. */
export function heuristicParseSms(sms: RawSms): SmsMatchResult | null {
  if (
    isNonTransactionalSms(sms.body) ||
    isBalanceOnlySms(sms.body) ||
    isPromoOrLimitSms(sms.body)
  ) {
    return null;
  }
  if (!hasTransactionalSignal(sms.body)) {
    return null;
  }
  const amount = extractHeuristicAmount(sms.body, null);
  if (!amount) {
    return null;
  }
  const fields: SmsParsedFields = {
    amountMinor: amount.amountMinor,
    currency: amount.currency,
    merchant: extractHeuristicMerchant(sms.body),
    type: inferType(null, null, sms.body) ?? 'expense',
    cardLast4: extractCardLast4(sms.body),
    direction: null,
    rawGroups: {amount: amount.raw},
    reference: extractReference(sms.body),
    occurredAtHint: extractOccurredAtHint(sms.body),
    matchScore: amount.candidates[0]?.score ?? 0,
  };
  return {rule: HEURISTIC_RULE, fields};
}

function scoreRuleHit(hit: SmsMatchResult, body: string): number {
  let score = 1000 - hit.rule.priority;
  if (hit.fields.amountMinor != null) {
    score += 200;
  }
  if (hit.fields.currency) {
    score += 80;
  }
  if (hit.fields.merchant) {
    score += 40;
  }
  if (hit.fields.cardLast4) {
    score += 20;
  }
  const hay = normalizeSmsText(body).toLowerCase();
  if (/\b(fee|رسوم|balance|رصيد|limit)\b/.test(hay) && hit.rule.priority >= 40) {
    score -= 120;
  }
  if (!hit.rule.senderPattern.includes('/.*/')) {
    score += 50;
  }
  hit.fields.matchScore = score;
  return score;
}

export function applyRule(rule: SmsRule, sms: RawSms): SmsMatchResult | null {
  if (!rule.enabled) {
    return null;
  }
  if (isNonTransactionalSms(sms.body) || isPromoOrLimitSms(sms.body)) {
    return null;
  }
  // Balance-only templates must not match transaction rules (except explicit balance name).
  if (isBalanceOnlySms(sms.body) && !/balance/i.test(rule.name)) {
    return null;
  }
  if (!senderMatches(sms.sender, rule.senderPattern)) {
    return null;
  }

  let re: RegExp;
  try {
    re = new RegExp(rule.bodyRegex, 'i');
  } catch {
    return null;
  }

  const body = normalizeSmsText(sms.body);
  const match = re.exec(body);
  if (!match?.groups) {
    return null;
  }

  const groups: Record<string, string> = {};
  for (const [k, v] of Object.entries(match.groups)) {
    if (typeof v === 'string') {
      groups[k] = v;
    }
  }

  const map = rule.captureMap;
  const amountGroup = map.amount ? groups[map.amount] : undefined;
  const currencyGroup = map.currency ? groups[map.currency] : undefined;
  const merchantGroup = map.merchant ? groups[map.merchant] : undefined;
  const typeGroup = map.type ? groups[map.type] : undefined;
  const cardGroup = map.cardLast4 ? groups[map.cardLast4] : undefined;
  const directionGroup = map.direction ? groups[map.direction] : undefined;
  const referenceGroup = map.reference ? groups[map.reference] : undefined;
  const feeGroup = map.fee ? groups[map.fee] : undefined;
  const balanceGroup = map.balance ? groups[map.balance] : undefined;

  const currency =
    normalizeCurrencyCode(currencyGroup) ?? detectCurrencyNearAmount(body);
  let amountMinor = amountGroup ? parseAmountToMinor(amountGroup, currency) : null;

  // Prefer captured amount; do not silently replace with a different heuristic amount.
  if (amountMinor == null && amountGroup == null) {
    const fallback = extractHeuristicAmount(body, currency);
    if (fallback) {
      amountMinor = fallback.amountMinor;
    }
  }

  const fields: SmsParsedFields = {
    amountMinor,
    currency,
    merchant: merchantGroup
      ? cleanMerchant(merchantGroup)
      : extractHeuristicMerchant(body),
    type: inferType(typeGroup ?? null, directionGroup ?? null, body),
    cardLast4: cardGroup?.replace(/\D/g, '').slice(-4) || extractCardLast4(body),
    direction: directionGroup?.trim() ?? null,
    rawGroups: groups,
    reference: referenceGroup?.trim() || extractReference(body),
    occurredAtHint: extractOccurredAtHint(body),
    feeAmountMinor: feeGroup ? parseAmountToMinor(feeGroup, currency) : null,
    balanceAmountMinor: balanceGroup
      ? parseAmountToMinor(balanceGroup, currency)
      : null,
  };

  return {rule, fields};
}

/** Rank all matching enabled rules (highest score first). */
export function matchSmsCandidates(
  sms: RawSms,
  rules: readonly SmsRule[],
): SmsMatchResult[] {
  const ordered = [...rules]
    .filter(r => r.enabled)
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));

  const hits: SmsMatchResult[] = [];
  for (const rule of ordered) {
    const hit = applyRule(rule, sms);
    if (hit) {
      scoreRuleHit(hit, sms.body);
      hits.push(hit);
    }
  }
  hits.sort(
    (a, b) =>
      (b.fields.matchScore ?? 0) - (a.fields.matchScore ?? 0) ||
      a.rule.priority - b.rule.priority,
  );
  return hits;
}

/**
 * Best matching enabled rule by scored candidates.
 * Falls back to heuristic extraction when no rule hits or amount is still null.
 */
export function matchSms(
  sms: RawSms,
  rules: readonly SmsRule[],
): SmsMatchResult | null {
  if (
    isNonTransactionalSms(sms.body) ||
    isPromoOrLimitSms(sms.body) ||
    isBalanceOnlySms(sms.body)
  ) {
    return null;
  }

  const candidates = matchSmsCandidates(sms, rules);
  const withAmount = candidates.filter(c => c.fields.amountMinor != null);
  if (withAmount[0]) {
    return withAmount[0];
  }

  const structural = candidates[0];
  if (structural) {
    const fallback = heuristicParseSms(sms);
    if (fallback) {
      return {
        rule: structural.rule,
        fields: {
          ...structural.fields,
          amountMinor: fallback.fields.amountMinor,
          currency: structural.fields.currency ?? fallback.fields.currency,
          merchant: structural.fields.merchant ?? fallback.fields.merchant,
          cardLast4: structural.fields.cardLast4 ?? fallback.fields.cardLast4,
          reference: structural.fields.reference ?? fallback.fields.reference,
          occurredAtHint:
            structural.fields.occurredAtHint ?? fallback.fields.occurredAtHint,
        },
      };
    }
    return structural;
  }

  return heuristicParseSms(sms);
}

/** Suggest a starter regex + capture map from a pasted body (best-effort). */
export function suggestRuleFromBody(body: string): {
  bodyRegex: string;
  captureMap: SmsCaptureMap;
  name: string;
} {
  const normalized = normalizeSmsText(body);
  const amountMatch =
    /\b(\d{1,3}(?:,\d{3})*(?:\.\d{1,3})?|\d+(?:\.\d{1,3})?)\s*([A-Z]{3})?\b/.exec(
      normalized,
    );
  const merchantMatch =
    /(?:at|to|from|merchant|pos)\s+([A-Za-z0-9 .&'-]{3,40})/i.exec(normalized);
  const cardMatch = /(?:card|ending|xx+)\s*[*:#-]?\s*(\d{4})/i.exec(normalized);

  const groups: string[] = [];
  const captureMap: SmsCaptureMap = {};
  let pattern = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (amountMatch?.[1]) {
    const token = amountMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    pattern = pattern.replace(token, '(?<amount>[\\d,.]+)');
    captureMap.amount = 'amount';
    groups.push('amount');
    if (amountMatch[2]) {
      const cur = amountMatch[2];
      pattern = pattern.replace(cur, '(?<currency>[A-Z]{3})');
      captureMap.currency = 'currency';
    }
  }

  if (merchantMatch?.[1]) {
    const token = merchantMatch[1].trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    pattern = pattern.replace(token, '(?<merchant>[A-Za-z0-9 .&\'-]{3,40})');
    captureMap.merchant = 'merchant';
  }

  if (cardMatch?.[1]) {
    pattern = pattern.replace(cardMatch[1], '(?<cardLast4>\\d{4})');
    captureMap.cardLast4 = 'cardLast4';
  }

  return {
    bodyRegex: pattern.slice(0, 400),
    captureMap,
    name: groups.length > 0 ? 'Generated rule' : 'Custom paste rule',
  };
}
