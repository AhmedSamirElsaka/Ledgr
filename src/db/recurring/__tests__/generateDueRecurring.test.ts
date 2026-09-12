import {generateDueRecurring} from '../generateDueRecurring';

import type {RecurringRuleRow} from '../../repositories/recurringRulesRepository';
import type {CreateTransactionInput, TransactionRow} from '../../repositories/transactionsRepository';

jest.mock('../../../lib/notifications', () => ({
  cancelRecurringReminder: jest.fn(async () => undefined),
  scheduleRecurringReminder: jest.fn(async () => undefined),
}));

const timestamp = '2026-01-01T12:00:00.000Z';

function rule(overrides: Partial<RecurringRuleRow> = {}): RecurringRuleRow {
  return {
    id: 'rule-1',
    name: 'Rent',
    account_id: 'account-1',
    category_id: 'category-1',
    amount_minor: 10000,
    currency: 'EGP',
    type: 'expense',
    cycle: 'monthly',
    custom_days: null,
    next_occurred_at: timestamp,
    note: null,
    active: 1,
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides,
  };
}

function transactionFromInput(input: CreateTransactionInput): TransactionRow {
  return {
    id: `tx-${input.sourceRef ?? 'new'}`,
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

describe('generateDueRecurring', () => {
  it('creates due occurrences and advances next_occurred_at', async () => {
    const due = rule();
    const create = jest.fn(
      async (input: CreateTransactionInput): Promise<TransactionRow> =>
        transactionFromInput(input),
    );
    const setNextOccurredAt = jest.fn(async (_id: string, nextOccurredAt: string) =>
      rule({next_occurred_at: nextOccurredAt}),
    );
    const findBySourceRef = jest.fn(async () => null);

    const result = await generateDueRecurring(
      {
        recurringRules: {
          listDue: async () => [due],
          listAll: async () => [due],
          setNextOccurredAt,
        },
        transactions: {create, findBySourceRef},
        settings: {get: async () => 'EGP'},
        fxRates: {getRate: async () => null},
      },
      new Date('2026-01-01T12:00:00.000Z'),
    );

    expect(result).toEqual({
      created: 1,
      skippedExisting: 0,
      rulesAdvanced: 1,
      blockedByFx: 0,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        amountMinor: 10000,
        source: 'recurring',
        sourceRef: 'recurring:rule-1:2026-01-01T12:00:00.000Z',
        fxRateToBase: 1,
        baseAmountMinor: 10000,
      }),
    );
    expect(setNextOccurredAt).toHaveBeenCalledWith('rule-1', '2026-02-01T12:00:00.000Z');
  });

  it('skips existing occurrence keys (idempotent re-open)', async () => {
    const due = rule();
    const create = jest.fn(
      async (input: CreateTransactionInput): Promise<TransactionRow> =>
        transactionFromInput(input),
    );
    const setNextOccurredAt = jest.fn(async (_id: string, nextOccurredAt: string) =>
      rule({next_occurred_at: nextOccurredAt}),
    );

    const result = await generateDueRecurring(
      {
        recurringRules: {
          listDue: async () => [due],
          listAll: async () => [due],
          setNextOccurredAt,
        },
        transactions: {
          create,
          findBySourceRef: async () =>
            transactionFromInput({
              accountId: due.account_id,
              amountMinor: due.amount_minor,
              currency: 'EGP',
              fxRateToBase: 1,
              baseAmountMinor: due.amount_minor,
              type: 'expense',
              source: 'recurring',
              sourceRef: 'recurring:rule-1:2026-01-01T12:00:00.000Z',
            }),
        },
        settings: {get: async () => 'EGP'},
        fxRates: {getRate: async () => null},
      },
      new Date('2026-01-01T12:00:00.000Z'),
    );

    expect(result.created).toBe(0);
    expect(result.skippedExisting).toBe(1);
    expect(result.rulesAdvanced).toBe(1);
    expect(create).not.toHaveBeenCalled();
    expect(setNextOccurredAt).toHaveBeenCalledWith('rule-1', '2026-02-01T12:00:00.000Z');
  });

  it('blocks foreign-currency dues when no FX rate is configured', async () => {
    const due = rule({currency: 'USD'});
    const create = jest.fn(
      async (input: CreateTransactionInput): Promise<TransactionRow> =>
        transactionFromInput(input),
    );
    const setNextOccurredAt = jest.fn(async (_id: string, nextOccurredAt: string) =>
      rule({next_occurred_at: nextOccurredAt}),
    );

    const result = await generateDueRecurring(
      {
        recurringRules: {
          listDue: async () => [due],
          listAll: async () => [due],
          setNextOccurredAt,
        },
        transactions: {create, findBySourceRef: async () => null},
        settings: {get: async () => 'EGP'},
        fxRates: {getRate: async () => null},
      },
      new Date('2026-01-01T12:00:00.000Z'),
    );

    expect(result).toEqual({
      created: 0,
      skippedExisting: 0,
      rulesAdvanced: 0,
      blockedByFx: 1,
    });
    expect(create).not.toHaveBeenCalled();
    expect(setNextOccurredAt).not.toHaveBeenCalled();
  });
});
