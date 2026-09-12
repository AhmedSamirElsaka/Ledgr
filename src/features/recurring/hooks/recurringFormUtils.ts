import {
  CURRENCIES,
  isCurrencyCode,
  type CurrencyCode,
} from '../../../domain/money/Money';

import type {RecurringRuleType} from '../../../db/repositories/recurringRulesRepository';
import type {RecurringCycle} from '../../../domain/recurring/cycle';

export const RECURRING_CYCLES: RecurringCycle[] = [
  'weekly',
  'monthly',
  'yearly',
  'custom',
];

export const RECURRING_TYPES: RecurringRuleType[] = ['expense', 'income'];

export function asRecurringCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

export function majorAmountFromMinor(
  amountMinor: number,
  currency: CurrencyCode,
): string {
  const exp = CURRENCIES[asRecurringCurrency(currency)].exponent;
  return String(amountMinor / 10 ** exp);
}
