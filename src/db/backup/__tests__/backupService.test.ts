import {prepareBackup} from '../../../domain/backup/schema';
import {buildBackupPayload, restoreBackup, restorePreparedBackup} from '../backupService';

import type {SqlDatabase, SqlResult, SqlRow} from '../../types';

jest.mock('../../receipts/receiptStorage', () => ({
  collectReceiptFiles: jest.fn(async () => ({})),
  restoreReceiptFiles: jest.fn(async () => undefined),
  removeOrphanReceiptFiles: jest.fn(async () => 0),
}));

const receiptStorage = jest.requireMock('../../receipts/receiptStorage') as {
  collectReceiptFiles: jest.Mock;
  restoreReceiptFiles: jest.Mock;
  removeOrphanReceiptFiles: jest.Mock;
};

const now = '2026-09-10T00:00:00.000Z';

const account = {
  id: 'account-1',
  name: 'Cash',
  type: 'cash',
  currency: 'EGP',
  opening_balance_minor: 0,
  color: 'green',
  icon: 'wallet',
  archived: 0,
  created_at: now,
  updated_at: now,
};

const receiptTransaction = {
  id: 'tx-1',
  account_id: account.id,
  category_id: null,
  amount_minor: -1500,
  currency: 'EGP',
  fx_rate_to_base: 1,
  base_amount_minor: -1500,
  type: 'expense',
  transfer_pair_id: null,
  note: null,
  merchant: 'Cafe',
  receipt_path: 'receipts/tx-1.jpg',
  occurred_at: now,
  created_at: now,
  updated_at: now,
  source: 'manual',
  source_ref: null,
  deleted_at: null,
  auto_categorized: 0,
};

const recurringRule = {
  id: 'recurring-1',
  name: 'Rent',
  account_id: account.id,
  category_id: null,
  amount_minor: 500000,
  currency: 'EGP',
  type: 'expense',
  cycle: 'monthly',
  custom_days: null,
  next_occurred_at: '2026-10-01T00:00:00.000Z',
  note: null,
  active: 1,
  created_at: now,
  updated_at: now,
};

function backupWithRecurringRule() {
  return {
    version: 2,
    exportedAt: now,
    settings: [],
    accounts: [account],
    categories: [],
    transactions: [],
    budgets: [],
    subscriptions: [],
    sms_rules: [],
    sms_messages: [],
    recurring_rules: [recurringRule],
    fx_rates: [],
    merchant_aliases: [],
    tags: [],
    transaction_tags: [],
  };
}

describe('backup service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    receiptStorage.collectReceiptFiles.mockResolvedValue({});
    receiptStorage.restoreReceiptFiles.mockResolvedValue(undefined);
    receiptStorage.removeOrphanReceiptFiles.mockResolvedValue(0);
  });

  it('exports schema v2 with recurring rules', async () => {
    const rowsByTable = new Map<string, SqlRow[]>([
      ['accounts', [account]],
      ['recurring_rules', [recurringRule]],
    ]);
    const db: SqlDatabase = {
      execute: async sql => {
        const table = /^SELECT \* FROM ([a-z_]+)$/.exec(sql)?.[1] ?? '';
        return {rows: rowsByTable.get(table) ?? [], rowsAffected: 0};
      },
      transaction: async fn => {
        await fn(db);
      },
    };

    const payload = await buildBackupPayload(db);

    expect(payload.version).toBe(2);
    expect(payload.recurring_rules).toEqual([recurringRule]);
  });

  it('exports receipt_path metadata and embedded receipt bytes', async () => {
    receiptStorage.collectReceiptFiles.mockResolvedValue({
      'receipts/tx-1.jpg': 'aGVsbG8=',
    });
    const rowsByTable = new Map<string, SqlRow[]>([
      ['accounts', [account]],
      ['transactions', [receiptTransaction]],
    ]);
    const db: SqlDatabase = {
      execute: async sql => {
        const table = /^SELECT \* FROM ([a-z_]+)$/.exec(sql)?.[1] ?? '';
        return {rows: rowsByTable.get(table) ?? [], rowsAffected: 0};
      },
      transaction: async fn => {
        await fn(db);
      },
    };

    const payload = await buildBackupPayload(db);

    expect(payload.transactions[0]?.receipt_path).toBe('receipts/tx-1.jpg');
    expect(payload.receipt_files).toEqual({'receipts/tx-1.jpg': 'aGVsbG8='});
    expect(receiptStorage.collectReceiptFiles).toHaveBeenCalledWith(['receipts/tx-1.jpg']);
  });

  it('replaces all tables, including recurring rules, in one transaction', async () => {
    const prepared = prepareBackup(backupWithRecurringRule());
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) {
      return;
    }

    const executed: Array<{sql: string; params?: readonly unknown[]}> = [];
    let transactions = 0;
    const result = (): SqlResult => ({rows: [], rowsAffected: 0});
    const tx: SqlDatabase = {
      execute: async (sql, params) => {
        executed.push({sql, params});
        return result();
      },
      transaction: async fn => {
        await fn(tx);
      },
    };
    const db: SqlDatabase = {
      execute: tx.execute,
      transaction: async fn => {
        transactions += 1;
        await fn(tx);
      },
    };

    await restorePreparedBackup(db, prepared.prepared);

    expect(transactions).toBe(1);
    expect(executed.some(entry => entry.sql === 'DELETE FROM recurring_rules')).toBe(true);
    expect(executed.some(entry => entry.sql.startsWith('INSERT INTO recurring_rules'))).toBe(true);
  });

  it('does not open a transaction when preflight rejects the backup', async () => {
    let transactions = 0;
    const db: SqlDatabase = {
      execute: async () => ({rows: [], rowsAffected: 0}),
      transaction: async () => {
        transactions += 1;
      },
    };
    const invalid = {
      ...backupWithRecurringRule(),
      accounts: [],
    };

    const result = await restoreBackup(db, invalid);

    expect(result.ok).toBe(false);
    expect(transactions).toBe(0);
    expect(receiptStorage.restoreReceiptFiles).not.toHaveBeenCalled();
  });

  it('restores receipt_path rows and receipt files after a validated replace-all', async () => {
    const prepared = prepareBackup({
      ...backupWithRecurringRule(),
      transactions: [receiptTransaction],
      receipt_files: {'receipts/tx-1.jpg': 'aGVsbG8='},
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) {
      return;
    }

    const executed: Array<{sql: string; params?: readonly unknown[]}> = [];
    const result = (): SqlResult => ({rows: [], rowsAffected: 0});
    const tx: SqlDatabase = {
      execute: async (sql, params) => {
        executed.push({sql, params});
        return result();
      },
      transaction: async fn => {
        await fn(tx);
      },
    };
    const db: SqlDatabase = {
      execute: tx.execute,
      transaction: async fn => {
        await fn(tx);
      },
    };

    await restorePreparedBackup(db, prepared.prepared);

    expect(
      executed.some(
        entry =>
          entry.sql.startsWith('INSERT INTO transactions') &&
          Array.isArray(entry.params) &&
          entry.params.includes('receipts/tx-1.jpg'),
      ),
    ).toBe(true);
    expect(receiptStorage.restoreReceiptFiles).toHaveBeenCalledWith({
      'receipts/tx-1.jpg': 'aGVsbG8=',
    });
    expect(receiptStorage.removeOrphanReceiptFiles).toHaveBeenCalledWith(
      new Set(['receipts/tx-1.jpg']),
    );
  });
});
