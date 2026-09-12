/**
 * Currency metadata and Money value type.
 * All monetary amounts are integers in minor units — never floats.
 */

export type CurrencyCode = 'EGP' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED' | 'JPY' | 'KWD' | 'INR';

export type CurrencyInfo = {
  code: CurrencyCode;
  /** ISO 4217 exponent: decimals in major unit. */
  exponent: number;
  symbol: string;
  /** Where the symbol sits relative to the amount. */
  symbolPosition: 'prefix' | 'suffix';
};

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  EGP: {code: 'EGP', exponent: 2, symbol: 'E£', symbolPosition: 'prefix'},
  USD: {code: 'USD', exponent: 2, symbol: '$', symbolPosition: 'prefix'},
  EUR: {code: 'EUR', exponent: 2, symbol: '€', symbolPosition: 'prefix'},
  GBP: {code: 'GBP', exponent: 2, symbol: '£', symbolPosition: 'prefix'},
  SAR: {code: 'SAR', exponent: 2, symbol: '﷼', symbolPosition: 'suffix'},
  AED: {code: 'AED', exponent: 2, symbol: 'د.إ', symbolPosition: 'suffix'},
  JPY: {code: 'JPY', exponent: 0, symbol: '¥', symbolPosition: 'prefix'},
  KWD: {code: 'KWD', exponent: 3, symbol: 'KD', symbolPosition: 'suffix'},
  INR: {code: 'INR', exponent: 2, symbol: '₹', symbolPosition: 'prefix'},
};

export function isCurrencyCode(value: string): value is CurrencyCode {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, value);
}

export function getCurrency(code: CurrencyCode): CurrencyInfo {
  return CURRENCIES[code];
}

export type Money = {
  /** Signed integer in minor units. */
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
};

export function money(amountMinor: number, currency: CurrencyCode): Money {
  if (!Number.isInteger(amountMinor)) {
    throw new Error('Money amountMinor must be an integer');
  }
  return {amountMinor, currency};
}

export function majorToMinor(major: number, currency: CurrencyCode): number {
  const {exponent} = getCurrency(currency);
  const factor = 10 ** exponent;
  return Math.round(major * factor);
}

export function minorToMajor(amountMinor: number, currency: CurrencyCode): number {
  const {exponent} = getCurrency(currency);
  const factor = 10 ** exponent;
  return amountMinor / factor;
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function subMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor - b.amountMinor, a.currency);
}

export function negMoney(value: Money): Money {
  return money(-value.amountMinor, value.currency);
}

export function absMoney(value: Money): Money {
  return money(Math.abs(value.amountMinor), value.currency);
}

export function compareMoney(a: Money, b: Money): number {
  assertSameCurrency(a, b);
  return a.amountMinor - b.amountMinor;
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export type FormatMoneyOptions = {
  /** Show + for positive amounts. */
  signed?: boolean;
  /** Hide currency symbol. */
  hideSymbol?: boolean;
  locale?: string;
};

export function formatMoney(
  value: Money,
  options: FormatMoneyOptions = {},
): string {
  const {signed = false, hideSymbol = false, locale = 'en-US'} = options;
  const info = getCurrency(value.currency);
  const negative = value.amountMinor < 0;
  const absolute = Math.abs(value.amountMinor);
  const major = absolute / 10 ** info.exponent;
  const isAr = locale.toLowerCase().startsWith('ar');

  const numberPart = new Intl.NumberFormat(locale, {
    minimumFractionDigits: info.exponent,
    maximumFractionDigits: info.exponent,
    useGrouping: true,
  }).format(major);

  /** Unicode minus (U+2212) — distinct from hyphen; required for grayscale clarity with +. */
  const sign = negative ? '−' : signed && value.amountMinor > 0 ? '+' : '';
  if (hideSymbol) {
    return `${sign}${numberPart}`;
  }

  // EGP: EN uses E£ prefix; AR uses ج.م suffix (design-system currency rules).
  if (value.currency === 'EGP' && isAr) {
    return `${sign}${numberPart} ج.م`;
  }

  if (info.symbolPosition === 'prefix') {
    return `${sign}${info.symbol}${numberPart}`;
  }
  return `${sign}${numberPart} ${info.symbol}`;
}
