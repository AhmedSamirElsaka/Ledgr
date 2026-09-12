import {getAppLanguage} from './index';

/** BCP 47 locale for Intl number/currency formatting. */
export function getNumberLocale(): string {
  return getAppLanguage() === 'ar' ? 'ar-EG' : 'en-US';
}
