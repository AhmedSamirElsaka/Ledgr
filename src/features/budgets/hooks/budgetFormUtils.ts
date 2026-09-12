import {
  CURRENCIES,
  isCurrencyCode,
  type CurrencyCode,
} from '../../../domain/money/Money';

import type {BudgetPeriod} from '../../../db/repositories/budgetsRepository';

export const BUDGET_PERIODS: BudgetPeriod[] = ['weekly', 'monthly', 'custom'];

export function asBudgetCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

export function majorAmountFromMinor(
  amountMinor: number,
  currency: CurrencyCode,
): string {
  const exp = CURRENCIES[asBudgetCurrency(currency)].exponent;
  return String(amountMinor / 10 ** exp);
}
