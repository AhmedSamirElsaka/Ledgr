import {
  endOfDay,
  startOfDay,
  subDays,
} from 'date-fns';

import {majorToMinor, type CurrencyCode} from '../../domain/money/Money';
import {periodRange} from '../../domain/period/periodRange';

import type {
  TransactionListFilter,
  TransactionSource,
  TransactionType,
} from '../../db/repositories/transactionsRepository';

export type DatePreset =
  | 'all'
  | 'week'
  | 'month'
  | 'year'
  | '7d'
  | '30d'
  | '90d'
  | 'custom';

export type TxFilterState = {
  tagId: string | null;
  accountId: string | null;
  categoryId: string | null;
  type: TransactionType | null;
  source: TransactionSource | null;
  datePreset: DatePreset;
  customFrom: string;
  customTo: string;
  minAmountMajor: string;
  maxAmountMajor: string;
};

export const EMPTY_TX_FILTERS: TxFilterState = {
  tagId: null,
  accountId: null,
  categoryId: null,
  type: null,
  source: null,
  datePreset: 'all',
  customFrom: '',
  customTo: '',
  minAmountMajor: '',
  maxAmountMajor: '',
};

/** Parse YYYY-MM-DD as a local calendar date (avoids UTC shift from parseISO). */
function parseLocalYmd(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function resolveDateBounds(
  filters: TxFilterState,
): {fromIso?: string; toIso?: string} {
  const now = new Date();
  switch (filters.datePreset) {
    case 'all':
      return {};
    case 'week': {
      const range = periodRange('week', now);
      return range ? {fromIso: range.fromIso, toIso: range.toIso} : {};
    }
    case 'month': {
      const range = periodRange('month', now);
      return range ? {fromIso: range.fromIso, toIso: range.toIso} : {};
    }
    case 'year': {
      const range = periodRange('year', now);
      return range ? {fromIso: range.fromIso, toIso: range.toIso} : {};
    }
    case '7d':
      return {
        fromIso: startOfDay(subDays(now, 7)).toISOString(),
        toIso: endOfDay(now).toISOString(),
      };
    case '30d':
      return {
        fromIso: startOfDay(subDays(now, 30)).toISOString(),
        toIso: endOfDay(now).toISOString(),
      };
    case '90d':
      return {
        fromIso: startOfDay(subDays(now, 90)).toISOString(),
        toIso: endOfDay(now).toISOString(),
      };
    case 'custom': {
      let fromIso: string | undefined;
      let toIso: string | undefined;
      const from = parseLocalYmd(filters.customFrom);
      if (from) {
        fromIso = startOfDay(from).toISOString();
      }
      const to = parseLocalYmd(filters.customTo);
      if (to) {
        toIso = endOfDay(to).toISOString();
      }
      return {fromIso, toIso};
    }
    default:
      return {};
  }
}

function parseMajorAmount(text: string, currency: CurrencyCode): number | undefined {
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined;
  }
  const major = Number(trimmed);
  if (!Number.isFinite(major) || major < 0) {
    return undefined;
  }
  return majorToMinor(major, currency);
}

export function toListFilter(
  filters: TxFilterState,
  search: string,
  limit: number,
  amountCurrency: CurrencyCode,
): TransactionListFilter {
  const dates = resolveDateBounds(filters);
  return {
    search,
    limit,
    tagId: filters.tagId ?? undefined,
    accountId: filters.accountId ?? undefined,
    categoryId: filters.categoryId ?? undefined,
    type: filters.type ?? undefined,
    source: filters.source ?? undefined,
    fromIso: dates.fromIso,
    toIso: dates.toIso,
    minAmountMinor: parseMajorAmount(filters.minAmountMajor, amountCurrency),
    maxAmountMinor: parseMajorAmount(filters.maxAmountMajor, amountCurrency),
  };
}

export function countActiveFilters(filters: TxFilterState): number {
  let n = 0;
  if (filters.tagId) {
    n += 1;
  }
  if (filters.accountId) {
    n += 1;
  }
  if (filters.categoryId) {
    n += 1;
  }
  if (filters.type) {
    n += 1;
  }
  if (filters.source) {
    n += 1;
  }
  if (filters.datePreset !== 'all') {
    n += 1;
  }
  if (filters.minAmountMajor.trim() || filters.maxAmountMajor.trim()) {
    n += 1;
  }
  return n;
}
