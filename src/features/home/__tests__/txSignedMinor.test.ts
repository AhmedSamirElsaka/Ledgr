import {txSignedMinor} from '../hooks/useHomeScreen';

import type {TransactionRow} from '../../../db/repositories/transactionsRepository';

function row(partial: Partial<TransactionRow> & Pick<TransactionRow, 'type'>): TransactionRow {
  return {
    id: 'tx-1',
    account_id: 'acc-1',
    category_id: 'cat-1',
    amount_minor: 1000,
    currency: 'EGP',
    fx_rate_to_base: 1,
    base_amount_minor: 1000,
    note: null,
    merchant: null,
    transfer_pair_id: null,
    source: 'manual',
    source_ref: null,
    receipt_path: null,
    occurred_at: '2026-03-12T10:00:00.000Z',
    created_at: '2026-03-12T10:00:00.000Z',
    updated_at: '2026-03-12T10:00:00.000Z',
    deleted_at: null,
    auto_categorized: 0,
    ...partial,
  };
}

describe('txSignedMinor', () => {
  it('forces expenses negative and income positive', () => {
    expect(txSignedMinor(row({type: 'expense', base_amount_minor: 500}))).toBe(-500);
    expect(txSignedMinor(row({type: 'expense', base_amount_minor: -500}))).toBe(-500);
    expect(txSignedMinor(row({type: 'income', base_amount_minor: -800}))).toBe(800);
  });

  it('keeps transfer signed magnitude as stored', () => {
    expect(txSignedMinor(row({type: 'transfer', base_amount_minor: -200}))).toBe(-200);
  });
});
