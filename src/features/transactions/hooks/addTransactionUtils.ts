import {isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';

export function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}
