import type {TransactionRow, TransactionSource} from '../../../db/repositories/transactionsRepository';

export type TransactionRowMetaLabels = {
  typeExpense: string;
  typeIncome: string;
  typeTransfer: string;
  sourceSms: string;
  sourceRecurring: string;
  sourceImport: string;
};

export function transactionTypeLabel(
  type: TransactionRow['type'],
  labels: Pick<TransactionRowMetaLabels, 'typeExpense' | 'typeIncome' | 'typeTransfer'>,
): string {
  if (type === 'expense') {
    return labels.typeExpense;
  }
  if (type === 'income') {
    return labels.typeIncome;
  }
  return labels.typeTransfer;
}

export function transactionSourceLabel(
  source: TransactionSource,
  labels: Pick<TransactionRowMetaLabels, 'sourceSms' | 'sourceRecurring' | 'sourceImport'>,
): string | null {
  if (source === 'sms') {
    return labels.sourceSms;
  }
  if (source === 'recurring') {
    return labels.sourceRecurring;
  }
  if (source === 'import') {
    return labels.sourceImport;
  }
  return null;
}

/**
 * Builds the secondary meta line: type · source (if non-manual) · tags · note (when merchant is title).
 */
export function buildTransactionRowMeta(
  tx: Pick<TransactionRow, 'type' | 'source' | 'merchant' | 'note'>,
  tagNames: readonly string[],
  labels: TransactionRowMetaLabels,
): string {
  const parts: string[] = [transactionTypeLabel(tx.type, labels)];
  const source = transactionSourceLabel(tx.source, labels);
  if (source) {
    parts.push(source);
  }
  if (tagNames.length > 0) {
    parts.push(tagNames.join(', '));
  }
  if (tx.merchant && tx.note) {
    parts.push(tx.note);
  }
  return parts.join(' · ');
}

export function transactionRowTitle(
  tx: Pick<TransactionRow, 'type' | 'merchant' | 'note'>,
  labels: Pick<TransactionRowMetaLabels, 'typeExpense' | 'typeIncome' | 'typeTransfer'>,
): string {
  return tx.merchant ?? tx.note ?? transactionTypeLabel(tx.type, labels);
}
