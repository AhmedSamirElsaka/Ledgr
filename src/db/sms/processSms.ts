import {isCurrencyCode, type CurrencyCode} from '../../domain/money/Money';
import {suggestCategorySmart} from '../../domain/smart/suggestCategory';
import {classifySms, type SmsParseDecision} from '../../domain/sms/classification';
import {dedupeHash, smsFingerprint} from '../../domain/sms/dedupe';
import {matchesIgnoreSimilar} from '../../domain/sms/ignoreSimilar';
import {
  HEURISTIC_RULE_ID,
  normalizeCurrencyCode,
  type RawSms,
  type SmsMatchResult,
} from '../../domain/sms/ruleEngine';
import {
  InvalidFxRateError,
  MissingFxRateError,
  resolveFxRateToBase,
  type FxRatesRepository,
} from '../repositories/fxRatesRepository';
import {smsRuleRowToEngine, type SmsRulesRepository} from '../repositories/smsRulesRepository';
import {loadCategoryMemory, recordCategoryTeach} from '../smart/categoryMemoryStore';

import {loadIgnoredSimilarPatterns} from './ignoredSimilar';

import type {AccountsRepository} from '../repositories/accountsRepository';
import type {CategoriesRepository} from '../repositories/categoriesRepository';
import type {MerchantAliasesRepository} from '../repositories/merchantAliasesRepository';
import type {SettingsRepository} from '../repositories/settingsRepository';
import type {
  CreateSmsMessageInput,
  SmsMessageRow,
  SmsMessagesRepository,
} from '../repositories/smsMessagesRepository';
import type {TransactionsRepository} from '../repositories/transactionsRepository';

export type SmsProcessRepos = {
  accounts: Pick<AccountsRepository, 'listActive'>;
  settings: Pick<SettingsRepository, 'get' | 'set'>;
  transactions: Pick<
    TransactionsRepository,
    'create' | 'createTransfer' | 'findBySourceRef'
  >;
  fxRates: Pick<FxRatesRepository, 'getRate'>;
  smsRules: Pick<SmsRulesRepository, 'listEnabled'>;
  /** Optional — enables keyword category hints during auto-ingest. */
  categories?: Pick<CategoriesRepository, 'listActive'>;
  smsMessages: Pick<
    SmsMessagesRepository,
    | 'create'
    | 'findByDedupeHash'
    | 'findByFingerprint'
    | 'findParsedByDedupeHash'
    | 'updateStatus'
    | 'getById'
  >;
  merchantAliases: Pick<
    MerchantAliasesRepository,
    'listMerchantCategoryHistory' | 'listRecentMerchantCategories' | 'upsert'
  >;
};

export type ProcessSmsInput = {
  sender: string;
  body: string;
  receivedAt: string;
  accountId?: string;
  /** Destination account for confirmed internal transfers. */
  toAccountId?: string;
  /** Park for interactive review instead of creating a transaction. */
  deferTransaction?: boolean;
  /** Update this existing sms_messages row instead of inserting a new one. */
  existingMessageId?: string;
  categoryId?: string | null;
  note?: string | null;
  /** Manual amount from review UI when auto-detect fails or needs correction. */
  amountMinorOverride?: number;
  /** Manual/ISO currency override from review UI. */
  currencyOverride?: string | null;
  /** Force income vs expense when confirming from review (incoming vs outgoing). */
  typeOverride?: 'expense' | 'income' | 'transfer';
  /** Android telephony _id when available. */
  deviceSmsId?: string | null;
  /** Skip merchant-alias training (bulk catch-all track). */
  skipMerchantLearning?: boolean;
  /** Allow confirm without requiring high confidence (user reviewed). */
  userConfirmed?: boolean;
  /**
   * Skip user-taught ignore-similar patterns (single-message review confirm).
   * Defaults to false — bulk/auto paths honor ignore list.
   */
  skipIgnoreSimilar?: boolean;
};

export type ProcessSmsResult = {
  status: 'parsed' | 'needs_review' | 'duplicate' | 'ignored' | 'deferred';
  messageId?: string;
  transactionId?: string;
  transferPairId?: string;
  match?: SmsMatchResult;
  decision?: SmsParseDecision;
  reason?: string;
};

function asCurrency(code: string | null | undefined, fallback: string): CurrencyCode | null {
  const normalized = normalizeCurrencyCode(code);
  if (normalized && isCurrencyCode(normalized)) {
    return normalized;
  }
  if (code && isCurrencyCode(code)) {
    return code;
  }
  if (isCurrencyCode(fallback)) {
    return fallback;
  }
  return null;
}

function matchedRuleIdForPersist(match: SmsMatchResult | null | undefined): string | null {
  if (!match || match.rule.id === HEURISTIC_RULE_ID) {
    return null;
  }
  return match.rule.id;
}

function resolveAccountId(
  accounts: Awaited<ReturnType<AccountsRepository['listActive']>>,
  preferredId: string | null | undefined,
  cardLast4: string | null | undefined,
): string | null {
  if (preferredId && accounts.some(a => a.id === preferredId)) {
    return preferredId;
  }
  if (cardLast4) {
    const byCard = accounts.find(a => a.name.includes(cardLast4));
    if (byCard) {
      return byCard.id;
    }
  }
  return null;
}

async function persistSmsMessage(
  repos: Pick<SmsProcessRepos, 'smsMessages'>,
  input: ProcessSmsInput,
  fields: Omit<CreateSmsMessageInput, 'sender' | 'body' | 'receivedAt'> &
    Partial<Pick<CreateSmsMessageInput, 'sender' | 'body' | 'receivedAt'>>,
): Promise<SmsMessageRow> {
  const payload: CreateSmsMessageInput = {
    sender: fields.sender ?? input.sender,
    body: fields.body ?? input.body,
    receivedAt: fields.receivedAt ?? input.receivedAt,
    status: fields.status,
    matchedRuleId: fields.matchedRuleId ?? null,
    createdTransactionId: fields.createdTransactionId ?? null,
    dedupeHash: fields.dedupeHash ?? null,
    fingerprint: fields.fingerprint ?? null,
    deviceSmsId: fields.deviceSmsId ?? input.deviceSmsId ?? null,
    parseMethod: fields.parseMethod ?? null,
    parseConfidence: fields.parseConfidence ?? null,
    parseReason: fields.parseReason ?? null,
    extractedReference: fields.extractedReference ?? null,
  };

  if (input.existingMessageId) {
    await repos.smsMessages.updateStatus(input.existingMessageId, payload.status, {
      matchedRuleId: payload.matchedRuleId,
      createdTransactionId: payload.createdTransactionId,
      dedupeHash: payload.dedupeHash,
      fingerprint: payload.fingerprint,
      parseMethod: payload.parseMethod,
      parseConfidence: payload.parseConfidence,
      parseReason: payload.parseReason,
      extractedReference: payload.extractedReference,
    });
    const updated = await repos.smsMessages.getById(input.existingMessageId);
    if (!updated) {
      throw new Error('SMS message not found');
    }
    return updated;
  }

  return repos.smsMessages.create(payload);
}

let cachedRules: ReturnType<typeof smsRuleRowToEngine>[] = [];

export function previewSmsWithRules(
  input: RawSms,
  rules: ReturnType<typeof smsRuleRowToEngine>[],
): {match: SmsMatchResult | null; decision: SmsParseDecision} {
  const decision = classifySms(input, rules);
  return {match: decision.match, decision};
}

export function previewSms(input: RawSms): {
  match: SmsMatchResult | null;
  decision: SmsParseDecision;
} {
  return previewSmsWithRules(input, cachedRules);
}

export async function loadSmsPreview(
  repos: Pick<SmsProcessRepos, 'smsRules'>,
  input: RawSms,
): Promise<{match: SmsMatchResult | null; decision: SmsParseDecision}> {
  const ruleRows = await repos.smsRules.listEnabled();
  cachedRules = ruleRows.map(smsRuleRowToEngine);
  return previewSmsWithRules(input, cachedRules);
}

export async function confirmSmsTransaction(
  repos: SmsProcessRepos,
  input: ProcessSmsInput,
): Promise<ProcessSmsResult> {
  return processSmsMessage(repos, {
    ...input,
    deferTransaction: false,
    userConfirmed: true,
    skipIgnoreSimilar: input.skipIgnoreSimilar ?? true,
  });
}

/**
 * Ingest one SMS: fingerprint → classify → create tx / transfer / defer / ignore.
 */
export async function processSmsMessage(
  repos: SmsProcessRepos,
  input: ProcessSmsInput,
): Promise<ProcessSmsResult> {
  const ruleRows = await repos.smsRules.listEnabled();
  const rules = ruleRows.map(smsRuleRowToEngine);
  cachedRules = rules;

  const raw: RawSms = {
    sender: input.sender,
    body: input.body,
    receivedAt: input.receivedAt,
  };
  const decision = classifySms(raw, rules);
  const match = decision.match;

  const fingerprint = smsFingerprint({
    sender: input.sender,
    body: input.body,
    receivedAt: input.receivedAt,
    deviceSmsId: input.deviceSmsId,
  });

  const existingByFp = await repos.smsMessages.findByFingerprint(fingerprint);
  if (existingByFp && existingByFp.id !== input.existingMessageId) {
    return {
      status: existingByFp.status === 'parsed' ? 'duplicate' : existingByFp.status,
      messageId: existingByFp.id,
      transactionId: existingByFp.created_transaction_id ?? undefined,
      match: match ?? undefined,
      decision,
      reason: 'Already imported (fingerprint)',
    };
  }

  const amountMinor =
    input.amountMinorOverride != null && Number.isFinite(input.amountMinorOverride)
      ? Math.round(Math.abs(input.amountMinorOverride))
      : (match?.fields.amountMinor ?? null);
  const ruleId = matchedRuleIdForPersist(match);
  const hash =
    amountMinor != null
      ? dedupeHash({
          sender: input.sender,
          amountMinor,
          receivedAtMs: Date.parse(input.receivedAt) || Date.now(),
          merchant: match?.fields.merchant,
          cardLast4: match?.fields.cardLast4,
          reference: decision.reference ?? match?.fields.reference,
        })
      : null;

  const meta = {
    fingerprint,
    deviceSmsId: input.deviceSmsId ?? null,
    parseMethod: decision.parseSource,
    parseConfidence: decision.confidence,
    parseReason: decision.reasons.join('|'),
    extractedReference: decision.reference,
  };

  if (!input.skipIgnoreSimilar) {
    const ignoredPatterns = await loadIgnoredSimilarPatterns(repos.settings);
    if (
      matchesIgnoreSimilar(ignoredPatterns, {
        sender: input.sender,
        merchant: match?.fields.merchant,
      })
    ) {
      const msg = await persistSmsMessage(repos, input, {
        status: 'ignored',
        matchedRuleId: ruleId,
        dedupeHash: hash,
        ...meta,
      });
      return {
        status: 'ignored',
        messageId: msg.id,
        match: match ?? undefined,
        decision,
        reason: 'Ignored similar (user rejected pattern)',
      };
    }
  }

  if (decision.classification === 'non_transaction' && input.deferTransaction) {
    const msg = await persistSmsMessage(repos, input, {
      status: 'ignored',
      matchedRuleId: ruleId,
      dedupeHash: hash,
      ...meta,
    });
    return {
      status: 'ignored',
      messageId: msg.id,
      match: match ?? undefined,
      decision,
      reason: decision.reasons.join(', ') || 'Non-transactional SMS',
    };
  }

  if (hash && !input.userConfirmed) {
    const parsedDup = await repos.smsMessages.findParsedByDedupeHash(hash);
    if (parsedDup && parsedDup.id !== input.existingMessageId) {
      return {
        status: 'duplicate',
        messageId: parsedDup.id,
        transactionId: parsedDup.created_transaction_id ?? undefined,
        match: match ?? undefined,
        decision,
        reason: 'Duplicate parsed transaction fingerprint',
      };
    }
  }

  if (input.deferTransaction) {
    const msg = await persistSmsMessage(repos, input, {
      status: 'needs_review',
      matchedRuleId: ruleId,
      dedupeHash: hash,
      ...meta,
    });
    return {
      status: 'deferred',
      messageId: msg.id,
      match: match ?? undefined,
      decision,
      reason: 'Waiting for category confirmation',
    };
  }

  if (amountMinor == null) {
    const msg = await persistSmsMessage(repos, input, {
      status: 'needs_review',
      matchedRuleId: ruleId,
      dedupeHash: hash,
      ...meta,
    });
    return {
      status: 'needs_review',
      messageId: msg.id,
      match: match ?? undefined,
      decision,
      reason: match ? 'Missing amount' : 'No matching rule',
    };
  }

  const baseCurrency = (await repos.settings.get('base_currency')) ?? 'EGP';
  const currency = asCurrency(
    input.currencyOverride ?? match?.fields.currency ?? null,
    baseCurrency,
  );
  if (!currency) {
    const msg = await persistSmsMessage(repos, input, {
      status: 'needs_review',
      matchedRuleId: ruleId,
      dedupeHash: hash,
      ...meta,
    });
    return {
      status: 'needs_review',
      messageId: msg.id,
      match: match ?? undefined,
      decision,
      reason: 'Unsupported or missing currency',
    };
  }

  const accounts = await repos.accounts.listActive();
  const accountId = resolveAccountId(
    accounts,
    input.accountId ?? match?.rule.defaultAccountId,
    match?.fields.cardLast4,
  );
  if (!accountId) {
    const msg = await persistSmsMessage(repos, input, {
      status: 'needs_review',
      matchedRuleId: ruleId,
      dedupeHash: hash,
      ...meta,
    });
    return {
      status: 'needs_review',
      messageId: msg.id,
      match: match ?? undefined,
      decision,
      reason: 'No account selected — pick an account to save',
    };
  }

  const merchant = match?.fields.merchant ?? null;
  let categoryId = input.categoryId ?? match?.rule.defaultCategoryId ?? null;
  let autoCategorized = false;

  const txType =
    input.typeOverride ??
    (decision.classification === 'internal_transfer'
      ? 'transfer'
      : match?.fields.type ?? 'expense');

  if (txType === 'transfer' || decision.classification === 'internal_transfer') {
    if (!input.toAccountId || input.toAccountId === accountId) {
      const msg = await persistSmsMessage(repos, input, {
        status: 'needs_review',
        matchedRuleId: ruleId,
        dedupeHash: hash,
        ...meta,
      });
      return {
        status: 'needs_review',
        messageId: msg.id,
        match: match ?? undefined,
        decision,
        reason: 'Internal transfer needs source and destination accounts',
      };
    }
  } else if (!categoryId && merchant) {
    const kind =
      txType === 'income' ? 'income' : ('expense' as const);
    const [history, recent, memory, catalogRows] = await Promise.all([
      repos.merchantAliases.listMerchantCategoryHistory(merchant),
      repos.merchantAliases.listRecentMerchantCategories(120),
      loadCategoryMemory(repos.settings),
      repos.categories
        ? repos.categories.listActive(kind).catch(() => [])
        : Promise.resolve([]),
    ]);
    const suggestion = suggestCategorySmart({
      merchant,
      sender: input.sender,
      body: input.body,
      kind,
      history: [...history, ...recent],
      memory,
      catalog: catalogRows.map(c => ({id: c.id, name: c.name})),
    });
    if (suggestion?.autoAssign) {
      categoryId = suggestion.categoryId;
      autoCategorized = true;
    }
  }

  const storedType =
    txType === 'income' ? 'income' : txType === 'transfer' ? 'transfer' : 'expense';

  let rateToBase: number;
  try {
    const base = asCurrency(baseCurrency, 'EGP');
    if (!base) {
      throw new MissingFxRateError(currency, 'EGP');
    }
    rateToBase = await resolveFxRateToBase(repos.fxRates, currency, base);
  } catch (error) {
    if (!(error instanceof MissingFxRateError) && !(error instanceof InvalidFxRateError)) {
      throw error;
    }
    const msg = await persistSmsMessage(repos, input, {
      status: 'needs_review',
      matchedRuleId: ruleId,
      dedupeHash: hash,
      ...meta,
    });
    return {
      status: 'needs_review',
      messageId: msg.id,
      match: match ?? undefined,
      decision,
      reason: error.message,
    };
  }

  const messageIdForRef = input.existingMessageId ?? fingerprint;
  const sourceRef = `sms:${messageIdForRef}`;
  const existingTx = await repos.transactions.findBySourceRef(sourceRef);
  if (existingTx) {
    const msg = await persistSmsMessage(repos, input, {
      status: 'parsed',
      matchedRuleId: ruleId,
      createdTransactionId: existingTx.id,
      dedupeHash: hash,
      ...meta,
    });
    return {
      status: 'duplicate',
      messageId: msg.id,
      transactionId: existingTx.id,
      match: match ?? undefined,
      decision,
      reason: 'Transaction already created for this SMS',
    };
  }

  const occurredAt = match?.fields.occurredAtHint ?? input.receivedAt;
  const noteParts = [
    input.note,
    match?.fields.cardLast4 ? `Card ••${match.fields.cardLast4}` : null,
    decision.reference ? `Ref ${decision.reference}` : null,
  ].filter(Boolean);

  if (storedType === 'transfer' && input.toAccountId) {
    const pair = await repos.transactions.createTransfer({
      fromAccountId: accountId,
      toAccountId: input.toAccountId,
      amountMinor,
      currency,
      fxRateToBase: rateToBase,
      baseAmountMinor: Math.round(amountMinor * rateToBase),
      note: noteParts.join(' · ') || null,
      occurredAt,
    });
    // Stamp source_ref on outgoing leg via update path is not available; rely on message link.
    const msg = await persistSmsMessage(repos, input, {
      status: 'parsed',
      matchedRuleId: ruleId,
      createdTransactionId: pair.out.id,
      dedupeHash: hash,
      ...meta,
    });
    return {
      status: 'parsed',
      messageId: msg.id,
      transactionId: pair.out.id,
      transferPairId: pair.inn.id,
      match: match ?? undefined,
      decision,
    };
  }

  const created = await repos.transactions.create({
    accountId,
    categoryId,
    amountMinor,
    currency,
    fxRateToBase: rateToBase,
    baseAmountMinor: Math.round(amountMinor * rateToBase),
    type: storedType === 'income' ? 'income' : 'expense',
    note: noteParts.join(' · ') || null,
    merchant,
    occurredAt,
    source: 'sms',
    sourceRef,
    autoCategorized: autoCategorized && !input.categoryId,
  });

  if (merchant && !input.skipMerchantLearning && input.categoryId) {
    await repos.merchantAliases.upsert({
      rawMerchant: merchant.toLowerCase(),
      displayMerchant: merchant,
      categoryId,
    });
  }

  if (input.userConfirmed && input.categoryId && storedType !== 'transfer') {
    await recordCategoryTeach(repos.settings, {
      merchant,
      sender: input.sender,
      categoryId: input.categoryId,
      kind: storedType === 'income' ? 'income' : 'expense',
    }).catch(() => undefined);
  }

  const msg = await persistSmsMessage(repos, input, {
    status: 'parsed',
    matchedRuleId: ruleId,
    createdTransactionId: created.id,
    dedupeHash: hash,
    ...meta,
  });

  return {
    status: 'parsed',
    messageId: msg.id,
    transactionId: created.id,
    match: match ?? undefined,
    decision,
  };
}
