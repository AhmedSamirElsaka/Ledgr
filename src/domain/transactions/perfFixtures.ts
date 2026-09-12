import type {TransactionRow} from '../../db/repositories/transactionsRepository';

/** Build N synthetic rows for pure JS performance benches (no DB). */
export function makeMockTransactions(count: number): TransactionRow[] {
  const rows: TransactionRow[] = [];
  const base = Date.parse('2024-01-01T12:00:00.000Z');
  const dayMs = 86_400_000;

  for (let i = 0; i < count; i++) {
    const isIncome = i % 17 === 0;
    const amount = 500 + ((i * 37) % 50_000);
    const signed = isIncome ? amount : -amount;
    const occurred = new Date(base + (i % 400) * dayMs + (i % 1000) * 1000).toISOString();
    rows.push({
      id: `perf-${i}`,
      account_id: 'acc-1',
      category_id: isIncome ? null : 'cat-1',
      amount_minor: signed,
      currency: 'EGP',
      fx_rate_to_base: 1,
      base_amount_minor: signed,
      type: isIncome ? 'income' : 'expense',
      transfer_pair_id: null,
      note: `note-${i}`,
      merchant: `Merchant ${i % 20}`,
      receipt_path: null,
      occurred_at: occurred,
      created_at: occurred,
      updated_at: occurred,
      source: 'import',
      source_ref: `perf.${i}`,
      deleted_at: null,
      auto_categorized: 0,
    });
  }
  return rows;
}
