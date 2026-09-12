import type {
  TransactionSource,
  TransactionType,
} from '../../../db/repositories/transactionsRepository';
import type {DatePreset} from '../transactionFilters';

export const DATE_PRESETS: DatePreset[] = [
  'all',
  'week',
  'month',
  'year',
  '7d',
  '30d',
  '90d',
  'custom',
];

export const FILTER_TYPES: (TransactionType | null)[] = [
  null,
  'expense',
  'income',
  'transfer',
];

export const FILTER_SOURCES: (TransactionSource | null)[] = [
  null,
  'manual',
  'sms',
  'import',
  'recurring',
];
