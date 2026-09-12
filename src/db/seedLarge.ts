import {createId, nowIso} from '../lib/id';

import type {SqlDatabase} from './types';

const MERCHANTS = [
  'Carrefour',
  'Uber',
  'Starbucks',
  'Amazon',
  'Shell',
  'Netflix',
  'Careem',
  'Spinneys',
  'Talabat',
  'Pharmacy',
  'Salary',
  'ATM',
  'Gym',
  'Orange',
  'Vodafone',
] as const;

/**
 * Bulk-insert synthetic transactions for performance testing.
 * Idempotent via settings flag `seed.large.v1` unless `force` is true.
 * Returns the number of rows inserted (0 if skipped).
 */
export async function seedLargeTransactions(
  db: SqlDatabase,
  count = 10_000,
  force = false,
): Promise<number> {
  if (!force) {
    const flag = await db.execute(`SELECT value FROM settings WHERE key = ?`, [
      'seed.large.v1',
    ]);
    if (flag.rows.length > 0) {
      return 0;
    }
  }

  const stamped = nowIso();
  let accountId: string;
  const accounts = await db.execute(
    `SELECT id FROM accounts WHERE archived = 0 ORDER BY created_at ASC LIMIT 1`,
  );
  if (accounts.rows[0]?.id != null) {
    accountId = String(accounts.rows[0].id);
  } else {
    accountId = createId();
    await db.execute(
      `INSERT INTO accounts (
        id, name, type, currency, opening_balance_minor, color, icon, archived, created_at, updated_at
      ) VALUES (?, ?, 'cash', 'EGP', 0, '#0F8F8A', 'Wallet', 0, ?, ?)`,
      [accountId, 'Perf Cash', stamped, stamped],
    );
  }

  const cats = await db.execute(
    `SELECT id FROM categories WHERE archived = 0 AND kind = 'expense' LIMIT 20`,
  );
  const categoryIds = cats.rows.map(r => String(r.id));

  const now = Date.now();
  const dayMs = 86_400_000;
  const batchSize = 500;
  let inserted = 0;

  for (let offset = 0; offset < count; offset += batchSize) {
    const slice = Math.min(batchSize, count - offset);
    const placeholders: string[] = [];
    const values: Array<string | number | null> = [];

    for (let i = 0; i < slice; i++) {
      const n = offset + i;
      const id = createId();
      const isIncome = n % 17 === 0;
      const amount = 500 + ((n * 37) % 50_000);
      const signed = isIncome ? amount : -amount;
      const merchant = MERCHANTS[n % MERCHANTS.length]!;
      const occurred = new Date(
        now - (n % 730) * dayMs - (n % 86_400) * 1000,
      ).toISOString();
      const categoryId = isIncome
        ? null
        : (categoryIds[n % Math.max(categoryIds.length, 1)] ?? null);

      placeholders.push('(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
      values.push(
        id,
        accountId,
        categoryId,
        signed,
        'EGP',
        1,
        signed,
        isIncome ? 'income' : 'expense',
        null,
        `seed-${n}`,
        merchant,
        occurred,
        stamped,
        stamped,
        'import',
        `seed.large.${n}`,
        null,
        0,
      );
    }

    await db.execute(
      `INSERT INTO transactions (
        id, account_id, category_id, amount_minor, currency, fx_rate_to_base,
        base_amount_minor, type, transfer_pair_id, note, merchant, occurred_at,
        created_at, updated_at, source, source_ref, deleted_at, auto_categorized
      ) VALUES ${placeholders.join(',')}`,
      values,
    );
    inserted += slice;
  }

  await db.execute(
    `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
    ['seed.large.v1', String(count), stamped],
  );

  return inserted;
}
