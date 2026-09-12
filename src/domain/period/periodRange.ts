import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from 'date-fns';

import type {PeriodFilter} from '../../store/uiStore';

/** Parse YYYY-MM-DD as a local calendar date (avoids UTC shift from parseISO). */
function parseLocalYmd(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
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

export function periodLabelKey(period: PeriodFilter): `period.${PeriodFilter}` {
  return `period.${period}`;
}

/** @deprecated Prefer t(periodLabelKey(period)) for i18n. */
export function periodLabel(period: PeriodFilter): string {
  switch (period) {
    case '7d':
      return '7 days';
    case '30d':
      return '30 days';
    case '90d':
      return '90 days';
    case 'custom':
      return 'Custom';
    case 'week':
      return 'Week';
    case 'month':
      return 'Month';
    case 'year':
      return 'Year';
    case 'all':
      return 'All';
    default:
      return period;
  }
}

export function periodRange(
  period: PeriodFilter,
  ref: Date = new Date(),
  custom?: {fromIso?: string | null; toIso?: string | null},
): {fromIso: string; toIso: string} | null {
  if (period === 'all') {
    return null;
  }

  if (period === 'custom') {
    const fromRaw = custom?.fromIso?.trim();
    const toRaw = custom?.toIso?.trim();
    if (!fromRaw || !toRaw) {
      return {
        fromIso: startOfDay(subDays(ref, 30)).toISOString(),
        toIso: endOfDay(ref).toISOString(),
      };
    }
    const from = parseLocalYmd(fromRaw);
    const to = parseLocalYmd(toRaw);
    if (!from || !to) {
      return {
        fromIso: startOfDay(subDays(ref, 30)).toISOString(),
        toIso: endOfDay(ref).toISOString(),
      };
    }
    return {
      fromIso: startOfDay(from).toISOString(),
      toIso: endOfDay(to).toISOString(),
    };
  }

  if (period === '7d') {
    return {
      fromIso: startOfDay(subDays(ref, 7)).toISOString(),
      toIso: endOfDay(ref).toISOString(),
    };
  }
  if (period === '30d') {
    return {
      fromIso: startOfDay(subDays(ref, 30)).toISOString(),
      toIso: endOfDay(ref).toISOString(),
    };
  }
  if (period === '90d') {
    return {
      fromIso: startOfDay(subDays(ref, 90)).toISOString(),
      toIso: endOfDay(ref).toISOString(),
    };
  }

  let start: Date;
  let end: Date;
  switch (period) {
    case 'week':
      start = startOfWeek(ref, {weekStartsOn: 1});
      end = endOfWeek(ref, {weekStartsOn: 1});
      break;
    case 'year':
      start = startOfYear(ref);
      end = endOfYear(ref);
      break;
    case 'month':
    default:
      start = startOfMonth(ref);
      end = endOfMonth(ref);
      break;
  }
  return {
    fromIso: startOfDay(start).toISOString(),
    toIso: endOfDay(end).toISOString(),
  };
}
