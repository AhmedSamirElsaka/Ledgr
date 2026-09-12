import {formatAnalyticsAxisLabel, formatAnalyticsPeriod} from '../formatAnalyticsPeriod';

jest.mock('../../../i18n/formatDate', () => ({
  formatDate: (date: Date, pattern: string) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    if (pattern === 'MMM d') {
      return `${m}-${d}`;
    }
    if (pattern === 'd MMM') {
      return `${d}/${m}`;
    }
    if (pattern === 'MMM yyyy') {
      return `${m}/${y}`;
    }
    if (pattern === 'MMM') {
      return m;
    }
    return `${y}-${m}-${d}`;
  },
}));

describe('formatAnalyticsPeriod', () => {
  it('formats day and month keys', () => {
    expect(formatAnalyticsPeriod('2026-09-10')).toBe('09-10');
    expect(formatAnalyticsPeriod('2026-09')).toBe('09/2026');
  });

  it('passes through unknown keys', () => {
    expect(formatAnalyticsPeriod('week-12')).toBe('week-12');
  });

  it('formats short axis labels', () => {
    expect(formatAnalyticsAxisLabel('2026-09-10')).toBe('10/09');
    expect(formatAnalyticsAxisLabel('2026-09')).toBe('09');
  });
});
