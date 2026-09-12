import {
  buildTransactionsLayouts,
  buildTransactionsListItems,
} from '../hooks/transactionsQueryUtils';

import type {TransactionRow} from '../../../db/repositories/transactionsRepository';

function tx(
  partial: Partial<TransactionRow> & Pick<TransactionRow, 'id' | 'occurred_at'>,
): TransactionRow {
  return {
    account_id: 'acc-1',
    category_id: 'cat-1',
    type: 'expense',
    amount_minor: 1000,
    currency: 'EGP',
    fx_rate_to_base: 1,
    base_amount_minor: 1000,
    note: null,
    merchant: 'Cafe',
    transfer_pair_id: null,
    source: 'manual',
    source_ref: null,
    receipt_path: null,
    created_at: partial.occurred_at,
    updated_at: partial.occurred_at,
    deleted_at: null,
    auto_categorized: 0,
    ...partial,
  };
}

describe('buildTransactionsListItems', () => {
  it('interleaves day headers and rows', () => {
    const items = buildTransactionsListItems([
      tx({id: '1', occurred_at: '2026-03-12T09:00:00.000Z'}),
      tx({id: '2', occurred_at: '2026-03-12T18:00:00.000Z'}),
      tx({id: '3', occurred_at: '2026-03-11T12:00:00.000Z'}),
    ]);

    expect(items.filter(i => i.kind === 'header')).toHaveLength(2);
    expect(items.filter(i => i.kind === 'row')).toHaveLength(3);
    expect(items[0]?.kind).toBe('header');
    expect(items[1]?.kind).toBe('row');
  });
});

describe('buildTransactionsLayouts', () => {
  it('accumulates offsets for sticky scroll math', () => {
    const items = buildTransactionsListItems([
      tx({id: '1', occurred_at: '2026-03-12T09:00:00.000Z'}),
    ]);
    const layouts = buildTransactionsLayouts(items);
    expect(layouts).toHaveLength(2);
    expect(layouts[0]?.offset).toBe(0);
    expect(layouts[1]?.offset).toBe(layouts[0]!.length);
  });
});
