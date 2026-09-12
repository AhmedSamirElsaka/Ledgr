import {
  serializeIgnoredSimilarSetting,
  SMS_IGNORED_SIMILAR_SETTING_KEY,
} from '../../../domain/sms/ignoreSimilar';
import {processSmsMessage, type SmsProcessRepos} from '../processSms';

import type {AccountRow} from '../../repositories/accountsRepository';
import type {MerchantAliasRow} from '../../repositories/merchantAliasesRepository';
import type {CreateSmsMessageInput, SmsMessageRow} from '../../repositories/smsMessagesRepository';
import type {SmsRuleRow} from '../../repositories/smsRulesRepository';
import type {
  CreateTransactionInput,
  TransactionRow,
} from '../../repositories/transactionsRepository';

const timestamp = '2026-01-02T12:00:00.000Z';

const account: AccountRow = {
  id: 'account-1',
  name: 'Card',
  type: 'card',
  currency: 'USD',
  opening_balance_minor: 0,
  color: 'blue',
  icon: 'credit-card',
  archived: 0,
  created_at: timestamp,
  updated_at: timestamp,
};

const rule: SmsRuleRow = {
  id: 'rule-1',
  name: 'Payment',
  sender_pattern: 'BANK',
  body_regex: 'paid (?<amount>[\\d.]+) (?<currency>[A-Z]{3})',
  capture_map_json: JSON.stringify({
    amount: 'amount',
    currency: 'currency',
  }),
  default_account_id: account.id,
  default_category_id: 'category-1',
  priority: 1,
  enabled: 1,
  created_at: timestamp,
  updated_at: timestamp,
};

function transactionFromInput(input: CreateTransactionInput): TransactionRow {
  return {
    id: 'transaction-1',
    account_id: input.accountId,
    category_id: input.categoryId ?? null,
    amount_minor: input.amountMinor,
    currency: input.currency,
    fx_rate_to_base: input.fxRateToBase,
    base_amount_minor: input.baseAmountMinor,
    type: input.type,
    transfer_pair_id: null,
    note: input.note ?? null,
    merchant: input.merchant ?? null,
    receipt_path: input.receiptPath ?? null,
    occurred_at: input.occurredAt ?? timestamp,
    created_at: timestamp,
    updated_at: timestamp,
    source: input.source ?? 'manual',
    source_ref: input.sourceRef ?? null,
    deleted_at: null,
    auto_categorized: input.autoCategorized ? 1 : 0,
  };
}

function messageFromInput(input: CreateSmsMessageInput): SmsMessageRow {
  return {
    id: 'message-1',
    sender: input.sender,
    body: input.body,
    received_at: input.receivedAt,
    status: input.status,
    matched_rule_id: input.matchedRuleId ?? null,
    created_transaction_id: input.createdTransactionId ?? null,
    dedupe_hash: input.dedupeHash ?? null,
    fingerprint: input.fingerprint ?? null,
    device_sms_id: input.deviceSmsId ?? null,
    parse_method: input.parseMethod ?? null,
    parse_confidence: input.parseConfidence ?? null,
    parse_reason: input.parseReason ?? null,
    extracted_reference: input.extractedReference ?? null,
    created_at: timestamp,
  };
}

function baseRepos(
  overrides: Partial<SmsProcessRepos> = {},
  createTransaction?: jest.Mock,
): SmsProcessRepos {
  const createTx =
    createTransaction ??
    jest.fn(async (input: CreateTransactionInput) => transactionFromInput(input));
  const alias: MerchantAliasRow = {
    id: 'alias-1',
    raw_merchant: 'merchant',
    display_merchant: 'Merchant',
    category_id: 'category-1',
    hit_count: 1,
    updated_at: timestamp,
  };
  return {
    accounts: {listActive: async () => [account]},
    settings: {
      get: async () => 'EGP',
      set: async () => undefined,
    },
    transactions: {
      create: createTx,
      createTransfer: async () => ({
        out: transactionFromInput({
          accountId: account.id,
          amountMinor: 1,
          currency: 'EGP',
          fxRateToBase: 1,
          baseAmountMinor: 1,
          type: 'expense',
        }),
        inn: transactionFromInput({
          accountId: account.id,
          amountMinor: 1,
          currency: 'EGP',
          fxRateToBase: 1,
          baseAmountMinor: 1,
          type: 'income',
        }),
      }),
      findBySourceRef: async () => null,
    },
    fxRates: {
      getRate: async (base, quote) => (base === 'EGP' && quote === 'USD' ? 50 : null),
    },
    smsRules: {listEnabled: async () => [rule]},
    smsMessages: {
      findByDedupeHash: async () => null,
      findByFingerprint: async () => null,
      findParsedByDedupeHash: async () => null,
      create: async input => messageFromInput(input),
      getById: async () => null,
      updateStatus: async () => undefined,
    },
    merchantAliases: {
      listMerchantCategoryHistory: async () => [],
      listRecentMerchantCategories: async () => [],
      upsert: async () => alias,
    },
    ...overrides,
  };
}

describe('processSmsMessage FX conversion', () => {
  it('marks a fingerprint match as already imported without creating a transaction', async () => {
    const existing = messageFromInput({
      sender: 'BANK',
      body: 'paid 12.34 USD',
      receivedAt: timestamp,
      status: 'parsed',
      matchedRuleId: 'rule-1',
      dedupeHash: 'existing-hash',
      fingerprint: 'fp-existing',
      createdTransactionId: 'transaction-old',
    });
    existing.id = 'message-existing';

    const createTransaction = jest.fn(
      async (input: CreateTransactionInput): Promise<TransactionRow> =>
        transactionFromInput(input),
    );

    const repos = baseRepos(
      {
        smsMessages: {
          findByDedupeHash: async () => null,
          findByFingerprint: async () => existing,
          findParsedByDedupeHash: async () => null,
          create: async input => messageFromInput(input),
          getById: async () => null,
          updateStatus: async () => undefined,
        },
      },
      createTransaction,
    );

    const result = await processSmsMessage(repos, {
      sender: 'BANK',
      body: 'paid 12.34 USD',
      receivedAt: timestamp,
      categoryId: 'category-1',
      accountId: account.id,
      userConfirmed: true,
    });

    expect(result.status).toBe('duplicate');
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('converts USD amount into base EGP using the stored FX rate', async () => {
    const createTransaction = jest.fn(
      async (input: CreateTransactionInput): Promise<TransactionRow> =>
        transactionFromInput(input),
    );
    const repos = baseRepos({}, createTransaction);

    const result = await processSmsMessage(repos, {
      sender: 'BANK',
      body: 'paid 12.34 USD',
      receivedAt: timestamp,
      categoryId: 'category-1',
      accountId: account.id,
      userConfirmed: true,
    });

    expect(result.status).toBe('parsed');
    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amountMinor: 1234,
        currency: 'USD',
        fxRateToBase: 50,
        baseAmountMinor: 61700,
        sourceRef: expect.stringMatching(/^sms:/),
      }),
    );
  });

  it('defers when FX rate is missing', async () => {
    const createTransaction = jest.fn(
      async (input: CreateTransactionInput): Promise<TransactionRow> =>
        transactionFromInput(input),
    );
    const repos = baseRepos(
      {
        fxRates: {getRate: async () => null},
      },
      createTransaction,
    );

    const result = await processSmsMessage(repos, {
      sender: 'BANK',
      body: 'paid 12.34 USD',
      receivedAt: timestamp,
      categoryId: 'category-1',
      accountId: account.id,
      userConfirmed: true,
    });

    expect(result.status).toBe('needs_review');
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('defers matching SMS for interactive review', async () => {
    const createTransaction = jest.fn(
      async (input: CreateTransactionInput): Promise<TransactionRow> =>
        transactionFromInput(input),
    );
    const repos = baseRepos({}, createTransaction);

    const result = await processSmsMessage(repos, {
      sender: 'BANK',
      body: 'paid 12.34 USD',
      receivedAt: timestamp,
      deferTransaction: true,
    });

    expect(result.status).toBe('deferred');
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('ignores non-transactional SMS on defer', async () => {
    const createTransaction = jest.fn(
      async (input: CreateTransactionInput): Promise<TransactionRow> =>
        transactionFromInput(input),
    );
    const repos = baseRepos({}, createTransaction);

    const result = await processSmsMessage(repos, {
      sender: 'NOTIFY',
      body: 'Missed call from Ahmed at 14:30',
      receivedAt: timestamp,
      deferTransaction: true,
    });

    expect(result.status).toBe('ignored');
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('updates an existing needs_review row instead of inserting a duplicate', async () => {
    const createTransaction = jest.fn(
      async (input: CreateTransactionInput): Promise<TransactionRow> =>
        transactionFromInput(input),
    );
    const updateStatus = jest.fn(async () => undefined);
    const existingRow = messageFromInput({
      sender: 'BANK',
      body: 'paid 12.34 USD',
      receivedAt: timestamp,
      status: 'needs_review',
    });
    existingRow.id = 'existing-review';

    const repos = baseRepos(
      {
        smsMessages: {
          findByDedupeHash: async () => null,
          findByFingerprint: async () => null,
          findParsedByDedupeHash: async () => null,
          create: async input => messageFromInput(input),
          getById: async id => (id === 'existing-review' ? {...existingRow, status: 'parsed'} : null),
          updateStatus,
        },
      },
      createTransaction,
    );

    const result = await processSmsMessage(repos, {
      sender: 'BANK',
      body: 'paid 12.34 USD',
      receivedAt: timestamp,
      existingMessageId: 'existing-review',
      categoryId: 'category-1',
      accountId: account.id,
      userConfirmed: true,
    });

    expect(result.status).toBe('parsed');
    expect(updateStatus).toHaveBeenCalled();
    expect(createTransaction).toHaveBeenCalled();
  });

  it('ignores matching SMS when ignore-similar pattern is stored', async () => {
    const createTransaction = jest.fn(
      async (input: CreateTransactionInput): Promise<TransactionRow> =>
        transactionFromInput(input),
    );
    const createMessage = jest.fn(async (input: CreateSmsMessageInput) =>
      messageFromInput(input),
    );
    const repos = baseRepos(
      {
        settings: {
          get: async (key: string) => {
            if (key === SMS_IGNORED_SIMILAR_SETTING_KEY) {
              return serializeIgnoredSimilarSetting([{sender: 'BANK', merchant: null}]);
            }
            return 'EGP';
          },
          set: async () => undefined,
        },
        smsMessages: {
          findByDedupeHash: async () => null,
          findByFingerprint: async () => null,
          findParsedByDedupeHash: async () => null,
          create: createMessage,
          getById: async () => null,
          updateStatus: async () => undefined,
        },
      },
      createTransaction,
    );

    const result = await processSmsMessage(repos, {
      sender: 'BANK',
      body: 'paid 12.34 USD',
      receivedAt: timestamp,
      deferTransaction: true,
    });

    expect(result.status).toBe('ignored');
    expect(result.reason).toMatch(/Ignored similar/);
    expect(createTransaction).not.toHaveBeenCalled();
    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({status: 'ignored'}),
    );
  });

  it('allows explicit confirm to override ignore-similar via skipIgnoreSimilar', async () => {
    const createTransaction = jest.fn(
      async (input: CreateTransactionInput): Promise<TransactionRow> =>
        transactionFromInput(input),
    );
    const repos = baseRepos(
      {
        settings: {
          get: async (key: string) => {
            if (key === SMS_IGNORED_SIMILAR_SETTING_KEY) {
              return serializeIgnoredSimilarSetting([{sender: 'BANK', merchant: null}]);
            }
            return 'EGP';
          },
          set: async () => undefined,
        },
      },
      createTransaction,
    );

    const result = await processSmsMessage(repos, {
      sender: 'BANK',
      body: 'paid 12.34 USD',
      receivedAt: timestamp,
      categoryId: 'category-1',
      accountId: account.id,
      userConfirmed: true,
      skipIgnoreSimilar: true,
    });

    expect(result.status).toBe('parsed');
    expect(createTransaction).toHaveBeenCalled();
  });
});
