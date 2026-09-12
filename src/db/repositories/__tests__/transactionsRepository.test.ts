import {
  TransactionMutationError,
  TransactionsRepository,
  type TransactionRow,
} from '../transactionsRepository';

import type {SqlDatabase, SqlParams, SqlResult} from '../../types';

const timestamp = '2026-01-01T00:00:00.000Z';

function transferRow(
  id: string,
  pairId: string,
  accountId: string,
  amountMinor: number,
): TransactionRow {
  return {
    id,
    account_id: accountId,
    category_id: null,
    amount_minor: amountMinor,
    currency: 'EGP',
    fx_rate_to_base: 1,
    base_amount_minor: amountMinor,
    type: 'transfer',
    transfer_pair_id: pairId,
    note: 'Old note',
    merchant: null,
    receipt_path: null,
    occurred_at: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
    source: 'manual',
    source_ref: null,
    deleted_at: null,
    auto_categorized: 0,
  };
}

function requiredParam(params: SqlParams | undefined, index: number) {
  const value = params?.[index];
  if (value === undefined) {
    throw new Error(`Missing SQL parameter ${index}`);
  }
  return value;
}

function stringParam(params: SqlParams | undefined, index: number): string {
  const value = requiredParam(params, index);
  if (typeof value !== 'string') {
    throw new Error(`Expected string SQL parameter ${index}`);
  }
  return value;
}

function numberParam(params: SqlParams | undefined, index: number): number {
  const value = requiredParam(params, index);
  if (typeof value !== 'number') {
    throw new Error(`Expected number SQL parameter ${index}`);
  }
  return value;
}

function nullableStringParam(params: SqlParams | undefined, index: number): string | null {
  const value = requiredParam(params, index);
  if (value !== null && typeof value !== 'string') {
    throw new Error(`Expected nullable string SQL parameter ${index}`);
  }
  return value;
}

function createTransferDb(
  out: TransactionRow,
  inn: TransactionRow,
): {
  db: SqlDatabase;
  get: (id: string) => TransactionRow | undefined;
  failOnUpdate: (number: number | null) => void;
  transactionCount: () => number;
} {
  const rows = new Map<string, TransactionRow>([
    [out.id, out],
    [inn.id, inn],
  ]);
  let updateCount = 0;
  let failedUpdate: number | null = null;
  let transactions = 0;

  const execute = async (sql: string, params?: SqlParams): Promise<SqlResult> => {
    const normalized = sql.replace(/\s+/g, ' ').trim();
    if (normalized.startsWith('SELECT * FROM transactions WHERE id = ?')) {
      const row = rows.get(stringParam(params, 0));
      return {rows: row ? [row] : [], rowsAffected: 0};
    }
    if (normalized.startsWith('UPDATE transactions SET category_id = NULL,')) {
      updateCount += 1;
      if (failedUpdate === updateCount) {
        throw new Error('Simulated write failure');
      }
      const id = stringParam(params, 7);
      const existing = rows.get(id);
      if (!existing) {
        return {rows: [], rowsAffected: 0};
      }
      rows.set(id, {
        ...existing,
        category_id: null,
        amount_minor: numberParam(params, 0),
        currency: stringParam(params, 1),
        fx_rate_to_base: numberParam(params, 2),
        base_amount_minor: numberParam(params, 3),
        note: nullableStringParam(params, 4),
        occurred_at: stringParam(params, 5),
        updated_at: stringParam(params, 6),
      });
      return {rows: [], rowsAffected: 1};
    }
    throw new Error(`Unexpected SQL: ${normalized}`);
  };

  const db: SqlDatabase = {
    execute,
    transaction: async fn => {
      transactions += 1;
      const snapshot = [...rows.entries()].map(([id, row]) => [id, {...row}] as const);
      try {
        await fn(db);
      } catch (error) {
        rows.clear();
        for (const [id, row] of snapshot) {
          rows.set(id, row);
        }
        throw error;
      }
    },
  };

  return {
    db,
    get: id => rows.get(id),
    failOnUpdate: number => {
      failedUpdate = number;
    },
    transactionCount: () => transactions,
  };
}

describe('TransactionsRepository transfer edits', () => {
  it('editing the incoming leg preserves equal and opposite signs', async () => {
    const out = transferRow('out', 'in', 'from-account', -100);
    const inn = transferRow('in', 'out', 'to-account', 100);
    const fake = createTransferDb(out, inn);
    const repo = new TransactionsRepository(fake.db);

    await repo.update('in', {
      amountMinor: 250,
      baseAmountMinor: 500,
      currency: 'USD',
      fxRateToBase: 2,
      note: 'Updated',
      occurredAt: '2026-02-01T00:00:00.000Z',
    });

    expect(fake.get('in')).toMatchObject({
      amount_minor: 250,
      base_amount_minor: 500,
      currency: 'USD',
      fx_rate_to_base: 2,
      note: 'Updated',
    });
    expect(fake.get('out')).toMatchObject({
      amount_minor: -250,
      base_amount_minor: -500,
      currency: 'USD',
      fx_rate_to_base: 2,
      note: 'Updated',
    });
    expect(fake.transactionCount()).toBe(1);
  });

  it('editing the outgoing leg remains negative even with positive input', async () => {
    const out = transferRow('out', 'in', 'from-account', -100);
    const inn = transferRow('in', 'out', 'to-account', 100);
    const fake = createTransferDb(out, inn);
    const repo = new TransactionsRepository(fake.db);

    await repo.update('out', {
      amountMinor: 275,
      baseAmountMinor: 275,
    });

    expect(fake.get('out')?.amount_minor).toBe(-275);
    expect(fake.get('in')?.amount_minor).toBe(275);
  });

  it('blocks account changes on an existing transfer', async () => {
    const out = transferRow('out', 'in', 'from-account', -100);
    const inn = transferRow('in', 'out', 'to-account', 100);
    const fake = createTransferDb(out, inn);
    const repo = new TransactionsRepository(fake.db);

    const promise = repo.update('out', {accountId: 'different-account'});
    await expect(promise).rejects.toBeInstanceOf(TransactionMutationError);
    await expect(promise).rejects.toMatchObject({
      code: 'transfer_account_change_not_supported',
    });
    expect(fake.transactionCount()).toBe(0);
  });

  it('blocks converting one transfer leg into a regular transaction', async () => {
    const out = transferRow('out', 'in', 'from-account', -100);
    const inn = transferRow('in', 'out', 'to-account', 100);
    const fake = createTransferDb(out, inn);
    const repo = new TransactionsRepository(fake.db);

    await expect(repo.update('out', {type: 'expense'})).rejects.toMatchObject({
      code: 'transfer_type_change_not_supported',
    });
    expect(fake.transactionCount()).toBe(0);
  });

  it('refuses malformed transfer links instead of updating one side', async () => {
    const out = transferRow('out', 'in', 'from-account', -100);
    const inn = transferRow('in', 'not-out', 'to-account', 100);
    const fake = createTransferDb(out, inn);
    const repo = new TransactionsRepository(fake.db);

    await expect(
      repo.update('out', {amountMinor: 250, baseAmountMinor: 250}),
    ).rejects.toMatchObject({code: 'invalid_transfer_pair'});
    expect(fake.get('out')?.amount_minor).toBe(-100);
    expect(fake.get('in')?.amount_minor).toBe(100);
  });

  it('rolls back both legs when the second update fails', async () => {
    const out = transferRow('out', 'in', 'from-account', -100);
    const inn = transferRow('in', 'out', 'to-account', 100);
    const fake = createTransferDb(out, inn);
    fake.failOnUpdate(2);
    const repo = new TransactionsRepository(fake.db);

    await expect(repo.update('out', {amountMinor: 250, baseAmountMinor: 250})).rejects.toThrow(
      'Simulated write failure',
    );
    expect(fake.get('out')?.amount_minor).toBe(-100);
    expect(fake.get('in')?.amount_minor).toBe(100);
    expect(fake.transactionCount()).toBe(1);
  });
});
