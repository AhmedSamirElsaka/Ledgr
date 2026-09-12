import {format, formatISO, parseISO, startOfDay} from 'date-fns';

import type {TransactionRow} from '../../db/repositories/transactionsRepository';

export type DayGroup = {
  dayKey: string;
  label: string;
  totalBaseMinor: number;
  transactions: TransactionRow[];
};

export function groupTransactionsByDay(
  rows: readonly TransactionRow[],
): DayGroup[] {
  const map = new Map<string, DayGroup>();

  for (const tx of rows) {
    const day = startOfDay(parseISO(tx.occurred_at));
    const dayKey = formatISO(day, {representation: 'date'});
    let group = map.get(dayKey);
    if (!group) {
      group = {
        dayKey,
        label: format(day, 'EEE, d MMM yyyy'),
        totalBaseMinor: 0,
        transactions: [],
      };
      map.set(dayKey, group);
    }
    group.transactions.push(tx);
    // Expenses reduce the daily total; income increases; transfers net per-leg.
    if (tx.type === 'expense') {
      group.totalBaseMinor -= Math.abs(tx.base_amount_minor);
    } else if (tx.type === 'income') {
      group.totalBaseMinor += Math.abs(tx.base_amount_minor);
    } else {
      group.totalBaseMinor += tx.base_amount_minor;
    }
  }

  return Array.from(map.values());
}
