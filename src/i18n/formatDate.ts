import {format} from 'date-fns';
import {ar, enUS} from 'date-fns/locale';

import {i18n} from './index';

import type {Locale} from 'date-fns';

/** date-fns locale matching the active app language. */
export function getDateFnsLocale(): Locale {
  return i18n.language?.startsWith('ar') ? ar : enUS;
}

/** Format a date with the active app locale (Arabic month/weekday names when lng=ar). */
export function formatDate(
  date: Date | number | string,
  pattern: string,
): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  return format(value, pattern, {locale: getDateFnsLocale()});
}
