import {
  CURRENCIES,
  isCurrencyCode,
  type CurrencyCode,
} from '../../../domain/money/Money';

import type {SubscriptionCycle} from '../../../domain/subscriptions/cycle';

export const SUBSCRIPTION_CYCLES: SubscriptionCycle[] = [
  'monthly',
  'yearly',
  'custom',
];

export function asSubscriptionCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

export function majorAmountFromMinor(
  amountMinor: number,
  currency: CurrencyCode,
): string {
  const exp = CURRENCIES[asSubscriptionCurrency(currency)].exponent;
  return String(amountMinor / 10 ** exp);
}
