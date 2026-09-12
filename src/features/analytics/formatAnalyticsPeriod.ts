import {formatDate} from '../../i18n/formatDate';

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;

/** Localize analytics period keys from SQL (`YYYY-MM-DD` or `YYYY-MM`). */
export function formatAnalyticsPeriod(period: string): string {
  const day = DAY_RE.exec(period);
  if (day) {
    const date = new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
    return formatDate(date, 'MMM d');
  }
  const month = MONTH_RE.exec(period);
  if (month) {
    const date = new Date(Number(month[1]), Number(month[2]) - 1, 1);
    return formatDate(date, 'MMM yyyy');
  }
  return period;
}

/** Short axis label for charts (keeps density reasonable). */
export function formatAnalyticsAxisLabel(period: string): string {
  const day = DAY_RE.exec(period);
  if (day) {
    const date = new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
    return formatDate(date, 'd MMM');
  }
  const month = MONTH_RE.exec(period);
  if (month) {
    const date = new Date(Number(month[1]), Number(month[2]) - 1, 1);
    return formatDate(date, 'MMM');
  }
  return period;
}
