import {prepareBackup} from '../schema';

function emptyBackup(version: 1 | 2) {
  return {
    version,
    exportedAt: '2026-09-10T00:00:00.000Z',
    settings: [],
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
    subscriptions: [],
    sms_rules: [],
    sms_messages: [],
    fx_rates: [],
    merchant_aliases: [],
    tags: [],
    transaction_tags: [],
    ...(version === 2 ? {recurring_rules: []} : {}),
  };
}

describe('backup preparation', () => {
  it('migrates an existing v1 backup to the current version', () => {
    const result = prepareBackup(emptyBackup(1));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.prepared.data.version).toBe(2);
    expect(result.prepared.data.recurring_rules).toEqual([]);
    expect(result.prepared.summary.sourceVersion).toBe(1);
  });

  it('includes recurring rules in a valid v2 preview', () => {
    const backup = {
      ...emptyBackup(2),
      accounts: [
        {
          id: 'account-1',
          name: 'Cash',
          type: 'cash',
          currency: 'EGP',
          opening_balance_minor: 0,
          color: 'green',
          icon: 'wallet',
          archived: 0,
          created_at: '2026-09-10T00:00:00.000Z',
          updated_at: '2026-09-10T00:00:00.000Z',
        },
      ],
      recurring_rules: [
        {
          id: 'recurring-1',
          name: 'Rent',
          account_id: 'account-1',
          category_id: null,
          amount_minor: 500000,
          currency: 'EGP',
          type: 'expense',
          cycle: 'monthly',
          custom_days: null,
          next_occurred_at: '2026-10-01T00:00:00.000Z',
          note: null,
          active: 1,
          created_at: '2026-09-10T00:00:00.000Z',
          updated_at: '2026-09-10T00:00:00.000Z',
        },
      ],
    };

    const result = prepareBackup(backup);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prepared.summary.counts.recurringRules).toBe(1);
      expect(result.prepared.summary.totalRows).toBe(2);
    }
  });

  it('rejects a missing foreign-key target during preflight', () => {
    const backup = {
      ...emptyBackup(2),
      recurring_rules: [
        {
          id: 'recurring-1',
          name: 'Rent',
          account_id: 'missing-account',
          category_id: null,
          amount_minor: 500000,
          currency: 'EGP',
          type: 'expense',
          cycle: 'monthly',
          custom_days: null,
          next_occurred_at: '2026-10-01T00:00:00.000Z',
          note: null,
          active: 1,
          created_at: '2026-09-10T00:00:00.000Z',
          updated_at: '2026-09-10T00:00:00.000Z',
        },
      ],
    };

    const result = prepareBackup(backup);

    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining('references missing id "missing-account"'),
    });
  });

  it('rejects unknown table columns before SQL insertion', () => {
    const backup = {
      ...emptyBackup(2),
      accounts: [
        {
          id: 'account-1',
          name: 'Cash',
          type: 'cash',
          currency: 'EGP',
          opening_balance_minor: 0,
          color: 'green',
          icon: 'wallet',
          archived: 0,
          created_at: '2026-09-10T00:00:00.000Z',
          updated_at: '2026-09-10T00:00:00.000Z',
          unsafe_column: 'DROP TABLE accounts',
        },
      ],
    };

    expect(prepareBackup(backup).ok).toBe(false);
  });

  it('accepts optional receipt_path and receipt_files without bumping schema version', () => {
    const backup = {
      ...emptyBackup(2),
      accounts: [
        {
          id: 'account-1',
          name: 'Cash',
          type: 'cash',
          currency: 'EGP',
          opening_balance_minor: 0,
          color: 'green',
          icon: 'wallet',
          archived: 0,
          created_at: '2026-09-10T00:00:00.000Z',
          updated_at: '2026-09-10T00:00:00.000Z',
        },
      ],
      transactions: [
        {
          id: 'tx-1',
          account_id: 'account-1',
          category_id: null,
          amount_minor: -100,
          currency: 'EGP',
          fx_rate_to_base: 1,
          base_amount_minor: -100,
          type: 'expense',
          transfer_pair_id: null,
          note: null,
          merchant: null,
          receipt_path: 'receipts/tx-1.jpg',
          occurred_at: '2026-09-10T00:00:00.000Z',
          created_at: '2026-09-10T00:00:00.000Z',
          updated_at: '2026-09-10T00:00:00.000Z',
          source: 'manual',
          source_ref: null,
          deleted_at: null,
          auto_categorized: 0,
        },
      ],
      receipt_files: {
        'receipts/tx-1.jpg': 'aGVsbG8=',
      },
    };

    const result = prepareBackup(backup);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prepared.data.transactions[0]?.receipt_path).toBe('receipts/tx-1.jpg');
      expect(result.prepared.data.receipt_files['receipts/tx-1.jpg']).toBe('aGVsbG8=');
    }
  });

  it('defaults missing receipt_path to null for older backups', () => {
    const backup = {
      ...emptyBackup(2),
      accounts: [
        {
          id: 'account-1',
          name: 'Cash',
          type: 'cash',
          currency: 'EGP',
          opening_balance_minor: 0,
          color: 'green',
          icon: 'wallet',
          archived: 0,
          created_at: '2026-09-10T00:00:00.000Z',
          updated_at: '2026-09-10T00:00:00.000Z',
        },
      ],
      transactions: [
        {
          id: 'tx-1',
          account_id: 'account-1',
          category_id: null,
          amount_minor: -100,
          currency: 'EGP',
          fx_rate_to_base: 1,
          base_amount_minor: -100,
          type: 'expense',
          transfer_pair_id: null,
          note: null,
          merchant: null,
          occurred_at: '2026-09-10T00:00:00.000Z',
          created_at: '2026-09-10T00:00:00.000Z',
          updated_at: '2026-09-10T00:00:00.000Z',
          source: 'manual',
          source_ref: null,
          deleted_at: null,
          auto_categorized: 0,
        },
      ],
    };

    const result = prepareBackup(backup);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prepared.data.transactions[0]?.receipt_path).toBeNull();
      expect(result.prepared.data.receipt_files).toEqual({});
    }
  });
});
