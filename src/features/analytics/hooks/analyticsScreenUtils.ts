import {endOfDay} from 'date-fns';

import {isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';
import {periodRange} from '../../../domain/period/periodRange';

import type {PeriodFilter} from '../../../store/uiStore';

export function asAnalyticsCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

export function resolveAnalyticsRange(
  period: PeriodFilter,
  customFrom: string,
  customTo: string,
): {fromIso: string; toIso: string} {
  const range = periodRange(period, new Date(), {
    fromIso: customFrom,
    toIso: customTo,
  });
  return {
    fromIso: range?.fromIso ?? '1970-01-01T00:00:00.000Z',
    toIso: range?.toIso ?? endOfDay(new Date()).toISOString(),
  };
}
