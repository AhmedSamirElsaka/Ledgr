import {
  predictNextDueDate,
  toMonthlyMinor,
  toYearlyMinor,
} from '../cycle';

describe('subscription cycle', () => {
  it('predicts monthly next due', () => {
    const next = predictNextDueDate(
      '2026-01-15T00:00:00.000Z',
      'monthly',
      null,
      new Date('2026-01-20T00:00:00.000Z'),
    );
    expect(next.startsWith('2026-02-15')).toBe(true);
  });

  it('predicts yearly next due', () => {
    const next = predictNextDueDate(
      '2025-09-10T00:00:00.000Z',
      'yearly',
      null,
      new Date('2026-09-10T12:00:00.000Z'),
    );
    expect(next.startsWith('2027-09-10')).toBe(true);
  });

  it('predicts custom days', () => {
    const next = predictNextDueDate(
      '2026-01-01T00:00:00.000Z',
      'custom',
      14,
      new Date('2026-01-10T00:00:00.000Z'),
    );
    expect(next.startsWith('2026-01-15')).toBe(true);
  });

  it('converts to monthly/yearly totals', () => {
    expect(toMonthlyMinor(1200, 'yearly', null)).toBe(100);
    expect(toYearlyMinor(100, 'monthly', null)).toBe(1200);
    expect(toMonthlyMinor(100, 'custom', 30)).toBe(100);
  });
});
