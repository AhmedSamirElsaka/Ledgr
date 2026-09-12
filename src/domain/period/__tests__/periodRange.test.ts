import {startOfDay, subDays} from 'date-fns';

import {periodLabel, periodRange} from '../periodRange';

function localYmd(iso: string | undefined): string {
  const d = new Date(iso ?? '');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

describe('periodRange', () => {
  const ref = new Date(2026, 8, 10, 12, 0, 0); // local Sep 10, 2026 noon

  it('returns null for all-time', () => {
    expect(periodRange('all', ref)).toBeNull();
  });

  it('covers last 7 / 30 / 90 days', () => {
    const seven = periodRange('7d', ref);
    const thirty = periodRange('30d', ref);
    const ninety = periodRange('90d', ref);
    expect(localYmd(seven?.fromIso)).toBe(localYmd(startOfDay(subDays(ref, 7)).toISOString()));
    expect(localYmd(thirty?.fromIso)).toBe(localYmd(startOfDay(subDays(ref, 30)).toISOString()));
    expect(localYmd(ninety?.fromIso)).toBe(localYmd(startOfDay(subDays(ref, 90)).toISOString()));
    expect(localYmd(seven?.toIso)).toBe('2026-09-10');
  });

  it('supports custom YYYY-MM-DD bounds', () => {
    const range = periodRange('custom', ref, {
      fromIso: '2026-01-01',
      toIso: '2026-01-31',
    });
    expect(localYmd(range?.fromIso)).toBe('2026-01-01');
    expect(localYmd(range?.toIso)).toBe('2026-01-31');
  });

  it('labels periods for UI chips', () => {
    expect(periodLabel('7d')).toBe('7 days');
    expect(periodLabel('custom')).toBe('Custom');
    expect(periodLabel('month')).toBe('Month');
  });
});
