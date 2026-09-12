import {type CurrencyCode} from '../../../domain/money/Money';
import {
  groupTransactionsByDay,
  type DayGroup,
} from '../../../domain/transactions/groupByDay';
import {ITEM_GAP, ROW_HEIGHT} from '../components/transactionListConstants';
import {HEADER_HEIGHT} from '../components/TransactionsDayHeader';

import {asCurrency} from './transactionsScreenUtils';

import type {TransactionRow} from '../../../db/repositories/transactionsRepository';

export type TransactionsListItem =
  | {kind: 'header'; group: DayGroup}
  | {kind: 'row'; tx: TransactionRow; currency: CurrencyCode};

export function buildTransactionsListItems(
  rows: TransactionRow[],
): TransactionsListItem[] {
  const groups = groupTransactionsByDay(rows);
  const out: TransactionsListItem[] = [];
  for (const group of groups) {
    out.push({kind: 'header', group});
    for (const tx of group.transactions) {
      out.push({kind: 'row', tx, currency: asCurrency(tx.currency)});
    }
  }
  return out;
}

export function buildTransactionsLayouts(items: TransactionsListItem[]) {
  let offset = 0;
  return items.map(item => {
    const length =
      (item.kind === 'header' ? HEADER_HEIGHT : ROW_HEIGHT) + ITEM_GAP;
    const entry = {length, offset, index: 0};
    offset += length;
    return entry;
  });
}
