/**
 * Structured SMS classification decision — confidence-gated, abstains on ambiguity.
 */

import {
  applyRule,
  extractHeuristicAmount,
  extractOccurredAtHint,
  extractReference,
  hasTransactionalSignal,
  heuristicParseSms,
  isBalanceOnlySms,
  isNonTransactionalSms,
  isPromoOrLimitSms,
  matchSmsCandidates,
  normalizeSmsText,
  type RawSms,
  type SmsMatchResult,
  type SmsRule,
} from './ruleEngine';

export type SmsClassification =
  | 'non_transaction'
  | 'expense'
  | 'income'
  | 'transfer_in'
  | 'transfer_out'
  | 'internal_transfer'
  | 'ambiguous';

export type SmsParseSource = 'rule' | 'heuristic' | 'hybrid' | 'none';

export type SmsFieldConfidence = {
  amount: number;
  currency: number;
  direction: number;
  merchant: number;
};

export type SmsParseDecision = {
  classification: SmsClassification;
  match: SmsMatchResult | null;
  confidence: number;
  highConfidence: boolean;
  parseSource: SmsParseSource;
  reasons: string[];
  fieldConfidence: SmsFieldConfidence;
  reference: string | null;
  occurredAtHint: string | null;
  competingAmounts: number;
};

const HIGH_CONFIDENCE_THRESHOLD = 72;

function ledgerTypeFromClassification(
  classification: SmsClassification,
): 'expense' | 'income' | 'transfer' | null {
  switch (classification) {
    case 'expense':
    case 'transfer_out':
      return 'expense';
    case 'income':
    case 'transfer_in':
      return 'income';
    case 'internal_transfer':
      return 'transfer';
    default:
      return null;
  }
}

function classifyFromBody(body: string): {
  classification: SmsClassification;
  directionConfidence: number;
  reasons: string[];
} {
  const hay = normalizeSmsText(body).toLowerCase();
  const reasons: string[] = [];

  const internal =
    /\b(between\s+your\s+accounts|own\s+account|internal\s+transfer|transfer\s+between\s+accounts|from\s+your\s+.*\s+to\s+your)\b/.test(
      hay,
    ) || /تحويل\s*(?:بين|داخلي)|من\s*حسابك\s*(?:الى|إلى)\s*حسابك/.test(hay);
  if (internal) {
    reasons.push('internal_transfer_language');
    return {classification: 'internal_transfer', directionConfidence: 80, reasons};
  }

  const transferOut =
    /\b(sent\s+to|you\s+sent|transfer(?:red)?\s+to|outgoing\s+transfer|funds\s+sent|money\s+sent)\b/.test(
      hay,
    ) ||
    /تحويل\s*صادر|حولت\s*(?:الى|إلى)|(?:تم\s+)?تحويل(?:ت)?\s*(?:مبلغ\s*)?(?:بنجاح\s*)?(?:الى|إلى)/.test(
      hay,
    );
  const transferIn =
    /\b(received\s+(?:a\s+)?(?:transfer|payment|instapay|ipn|money|funds)|(?:transfer|payment|instapay|ipn|money|funds)\s+received|incoming\s+transfer|you\s+received|received\s+from|has\s+sent\s+you|sent\s+you)\b/.test(
      hay,
    ) || /تم\s+استلام|استلمت|تحويل\s*وارد|حول\s+(?:إليك|لك|لحسابك)/.test(hay);

  if (transferOut && !transferIn) {
    reasons.push('outgoing_transfer');
    return {classification: 'transfer_out', directionConfidence: 88, reasons};
  }
  if (transferIn && !transferOut) {
    reasons.push('incoming_transfer');
    return {classification: 'transfer_in', directionConfidence: 88, reasons};
  }
  if (transferOut && transferIn) {
    reasons.push('competing_transfer_direction');
    return {classification: 'ambiguous', directionConfidence: 35, reasons};
  }

  if (
    /\b(instapay|ipn|upi|imps|neft)\b/.test(hay) ||
    /انستا\s*باي|إنستاباي|انستاباي/.test(hay)
  ) {
    if (
      /\b(you\s+received|received\s+from|incoming|credited\s+to\s+your)\b/.test(hay) ||
      /تم\s+استلام|استلمت/.test(hay)
    ) {
      reasons.push('rail_incoming');
      return {classification: 'transfer_in', directionConfidence: 82, reasons};
    }
    if (/\b(to|sent|paid|payment|outgoing|debited)\b/.test(hay) || /الى|إلى|خصم/.test(hay)) {
      reasons.push('rail_outgoing');
      return {classification: 'transfer_out', directionConfidence: 82, reasons};
    }
    reasons.push('rail_ambiguous');
    return {classification: 'ambiguous', directionConfidence: 40, reasons};
  }

  if (/\b(transfer|trf|wire)\b/.test(hay) || /تحويل/.test(hay)) {
    const hasFrom = /\bfrom\b/.test(hay) || /(?:^|[\s])من[\s]/.test(hay);
    const hasTo = /\bto\b/.test(hay) || /(?:الى|إلى)/.test(hay);
    if (hasFrom && !hasTo) {
      reasons.push('transfer_from');
      return {classification: 'transfer_in', directionConfidence: 75, reasons};
    }
    if (hasTo && !hasFrom) {
      reasons.push('transfer_to');
      return {classification: 'transfer_out', directionConfidence: 75, reasons};
    }
    reasons.push('transfer_ambiguous');
    return {classification: 'ambiguous', directionConfidence: 40, reasons};
  }

  // Expense before bare "received" (avoids "payment … received confirmation" → income).
  if (
    /\b(debit|purchase|paid|withdrawal|atm|pos|spent|payment|charged|txn)\b/.test(hay) ||
    /خصم|شراء|مدفوع|سحب|عملية|مصروف/.test(hay)
  ) {
    reasons.push('expense_keywords');
    return {classification: 'expense', directionConfidence: 85, reasons};
  }

  if (
    /\b(credit(?:ed)?|deposit(?:ed)?|salary|refund|cashback|received\s+from|incoming)\b/.test(
      hay,
    ) ||
    /ايداع|إيداع|راتب|مسترد|استرداد|تم اضافة|تم إضافة|رصيد دائن/.test(hay)
  ) {
    reasons.push('income_keywords');
    return {classification: 'income', directionConfidence: 85, reasons};
  }

  if (hasTransactionalSignal(body)) {
    reasons.push('transactional_signal_default_expense');
    return {classification: 'expense', directionConfidence: 45, reasons};
  }

  reasons.push('no_direction_signal');
  return {classification: 'ambiguous', directionConfidence: 20, reasons};
}

function scoreDecision(args: {
  parseSource: SmsParseSource;
  amountConfidence: number;
  currencyConfidence: number;
  directionConfidence: number;
  classification: SmsClassification;
  competingAmounts: number;
}): number {
  let score =
    args.amountConfidence * 0.4 +
    args.currencyConfidence * 0.2 +
    args.directionConfidence * 0.3;
  if (args.parseSource === 'rule') {
    score += 12;
  } else if (args.parseSource === 'hybrid') {
    score += 6;
  } else if (args.parseSource === 'heuristic') {
    score -= 4;
  }
  if (args.competingAmounts > 1) {
    score -= 10 * (args.competingAmounts - 1);
  }
  if (
    args.classification === 'ambiguous' ||
    args.classification === 'non_transaction' ||
    args.classification === 'internal_transfer'
  ) {
    score = Math.min(score, 55);
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Full parse + classification. Prefer this over raw matchSms for ingestion/UI.
 */
export function classifySms(
  sms: RawSms,
  rules: readonly SmsRule[],
): SmsParseDecision {
  const reasons: string[] = [];

  if (isNonTransactionalSms(sms.body)) {
    reasons.push('non_transactional');
    return emptyDecision('non_transaction', reasons);
  }
  if (isPromoOrLimitSms(sms.body)) {
    reasons.push('promo_or_limit');
    return emptyDecision('non_transaction', reasons);
  }
  if (isBalanceOnlySms(sms.body)) {
    reasons.push('balance_only');
    return emptyDecision('non_transaction', reasons);
  }

  const candidates = matchSmsCandidates(sms, rules);
  const withAmount = candidates.filter(c => c.fields.amountMinor != null);
  let match: SmsMatchResult | null = withAmount[0] ?? candidates[0] ?? null;
  let parseSource: SmsParseSource = match ? 'rule' : 'none';

  if (!match || match.fields.amountMinor == null) {
    const heuristic = heuristicParseSms(sms);
    if (heuristic) {
      if (match) {
        match = {
          rule: match.rule,
          fields: {
            ...match.fields,
            amountMinor: heuristic.fields.amountMinor,
            currency: match.fields.currency ?? heuristic.fields.currency,
            merchant: match.fields.merchant ?? heuristic.fields.merchant,
            cardLast4: match.fields.cardLast4 ?? heuristic.fields.cardLast4,
          },
        };
        parseSource = 'hybrid';
        reasons.push('rule_structure_heuristic_amount');
      } else {
        match = heuristic;
        parseSource = 'heuristic';
        reasons.push('heuristic_only');
      }
    }
  }

  if (!match) {
    reasons.push('no_match');
    return emptyDecision('ambiguous', reasons);
  }

  const amountInfo = extractHeuristicAmount(sms.body, match.fields.currency);
  const competingAmounts = amountInfo?.candidates?.length ?? (match.fields.amountMinor != null ? 1 : 0);

  const inferred = classifyFromBody(sms.body);
  reasons.push(...inferred.reasons);

  const classification = inferred.classification;
  const ledgerType = ledgerTypeFromClassification(classification);
  match = {
    ...match,
    fields: {
      ...match.fields,
      type:
        ledgerType ??
        (match.fields.type === 'income' || match.fields.type === 'expense'
          ? match.fields.type
          : null),
      classification,
      reference: extractReference(sms.body),
      occurredAtHint: extractOccurredAtHint(sms.body),
    },
  };

  const amountConfidence = match.fields.amountMinor != null ? (parseSource === 'rule' ? 90 : 70) : 10;
  const currencyConfidence = match.fields.currency
    ? parseSource === 'rule'
      ? 88
      : 65
    : 25;
  const merchantConfidence = match.fields.merchant ? 70 : 30;

  const confidence = scoreDecision({
    parseSource,
    amountConfidence,
    currencyConfidence,
    directionConfidence: inferred.directionConfidence,
    classification,
    competingAmounts,
  });

  const highConfidence =
    confidence >= HIGH_CONFIDENCE_THRESHOLD &&
    match.fields.amountMinor != null &&
    match.fields.currency != null &&
    (classification === 'expense' ||
      classification === 'income' ||
      classification === 'transfer_in' ||
      classification === 'transfer_out') &&
    parseSource !== 'heuristic';

  if (!highConfidence) {
    reasons.push('below_high_confidence_gate');
  }

  return {
    classification,
    match,
    confidence,
    highConfidence,
    parseSource,
    reasons,
    fieldConfidence: {
      amount: amountConfidence,
      currency: currencyConfidence,
      direction: inferred.directionConfidence,
      merchant: merchantConfidence,
    },
    reference: match.fields.reference ?? null,
    occurredAtHint: match.fields.occurredAtHint ?? null,
    competingAmounts,
  };
}

function emptyDecision(
  classification: SmsClassification,
  reasons: string[],
): SmsParseDecision {
  return {
    classification,
    match: null,
    confidence: 0,
    highConfidence: false,
    parseSource: 'none',
    reasons,
    fieldConfidence: {amount: 0, currency: 0, direction: 0, merchant: 0},
    reference: null,
    occurredAtHint: null,
    competingAmounts: 0,
  };
}

/** Best single match for backward-compatible callers. */
export function classifyAndMatch(
  sms: RawSms,
  rules: readonly SmsRule[],
): SmsMatchResult | null {
  const decision = classifySms(sms, rules);
  if (decision.classification === 'non_transaction') {
    return null;
  }
  return decision.match;
}

/** Re-export applyRule for tester multi-match listing. */
export {applyRule, matchSmsCandidates};
