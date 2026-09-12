import {isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';

export const PAGE_SIZE = 50;

export function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}
