import {
  listMonthKeys,
  listWeekKeys,
  mapAccountBalanceHistory,
  mapBudgetAdherenceHistory,
  mapStreakStats,
} from '../analyticsRepository';

describe('mapStreakStats', () => {
  it('handles empty', () => {
    expect(mapStreakStats([])).toEqual({current: 0, longest: 0, activeDays: 0});
  });

  it('computes longest and current from day keys', () => {
    const stats = mapStreakStats(['2026-09-08', '2026-09-09', '2026-09-10', '2026-09-01']);
    expect(stats.activeDays).toBe(4);
    expect(stats.longest).toBeGreaterThanOrEqual(3);
    expect(stats.current).toBe(3);
  });
});

describe('mapAccountBalanceHistory', () => {
  it('returns empty when there are no accounts', () => {
    expect(mapAccountBalanceHistory([], [], '2026-09-01')).toEqual([]);
  });

  it('emits a single opening point when the range has no activity', () => {
    const series = mapAccountBalanceHistory(
      [
        {
          accountId: 'a1',
          accountName: 'Cash',
          currency: 'EGP',
          color: null,
          balanceBeforeRangeMinor: 50000,
        },
      ],
      [],
      '2026-09-01',
    );
    expect(series).toEqual([
      {
        accountId: 'a1',
        accountName: 'Cash',
        currency: 'EGP',
        color: null,
        points: [{period: '2026-09-01', balanceMinor: 50000}],
      },
    ]);
  });

  it('builds a running balance and keeps a single-day series honest', () => {
    const series = mapAccountBalanceHistory(
      [
        {
          accountId: 'a1',
          accountName: 'Cash',
          currency: 'EGP',
          color: '#fff',
          balanceBeforeRangeMinor: 10000,
        },
      ],
      [{accountId: 'a1', period: '2026-09-05', deltaMinor: -2500}],
      '2026-09-01',
    );
    expect(series[0]?.points).toEqual([
      {period: '2026-09-01', balanceMinor: 10000},
      {period: '2026-09-05', balanceMinor: 7500},
    ]);
  });
});

describe('listMonthKeys / listWeekKeys', () => {
  it('lists inclusive month keys', () => {
    expect(listMonthKeys('2026-01-15', '2026-03-02')).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ]);
  });

  it('lists Monday week starts covering the range', () => {
    // 2026-09-10 Thu → week of 2026-09-07; range end 2026-09-14 Mon includes next week.
    expect(listWeekKeys('2026-09-10', '2026-09-14')).toEqual([
      '2026-09-07',
      '2026-09-14',
    ]);
    expect(listWeekKeys('2026-09-10', '2026-09-13')).toEqual(['2026-09-07']);
  });
});

describe('mapBudgetAdherenceHistory', () => {
  it('returns empty points when no budgets', () => {
    expect(mapBudgetAdherenceHistory([], [], '2026-09-01', '2026-09-30')).toEqual([]);
  });

  it('maps monthly spend vs budget including over-budget periods', () => {
    const series = mapBudgetAdherenceHistory(
      [
        {
          budgetId: 'b1',
          categoryId: 'c1',
          categoryName: 'Food',
          periodKind: 'monthly',
          amountMinor: 10000,
          startDate: '2026-01-01',
          endDate: null,
        },
      ],
      [
        {categoryId: 'c1', period: '2026-08', spentMinor: 8000},
        {categoryId: 'c1', period: '2026-09', spentMinor: 12000},
      ],
      '2026-08-01',
      '2026-09-30',
    );
    expect(series).toHaveLength(1);
    expect(series[0]?.points).toEqual([
      {
        period: '2026-08',
        budgetMinor: 10000,
        spentMinor: 8000,
        overBudget: false,
      },
      {
        period: '2026-09',
        budgetMinor: 10000,
        spentMinor: 12000,
        overBudget: true,
      },
    ]);
  });

  it('maps all-expense budgets via all: period keys', () => {
    const series = mapBudgetAdherenceHistory(
      [
        {
          budgetId: 'b2',
          categoryId: null,
          categoryName: '',
          periodKind: 'monthly',
          amountMinor: 50000,
          startDate: '2026-09-01',
          endDate: null,
        },
      ],
      [{categoryId: null, period: 'all:2026-09', spentMinor: 42000}],
      '2026-09-01',
      '2026-09-30',
    );
    expect(series[0]?.points).toEqual([
      {
        period: '2026-09',
        budgetMinor: 50000,
        spentMinor: 42000,
        overBudget: false,
      },
    ]);
  });

  it('maps a custom budget to a single adherence point', () => {
    const series = mapBudgetAdherenceHistory(
      [
        {
          budgetId: 'b3',
          categoryId: 'c2',
          categoryName: 'Travel',
          periodKind: 'custom',
          amountMinor: 20000,
          startDate: '2026-09-01',
          endDate: '2026-09-15',
        },
      ],
      [{categoryId: 'c2', period: 'custom:b3', spentMinor: 21000}],
      '2026-09-01',
      '2026-09-30',
    );
    expect(series[0]?.points).toEqual([
      {
        period: '2026-09-01→2026-09-15',
        budgetMinor: 20000,
        spentMinor: 21000,
        overBudget: true,
      },
    ]);
  });
});
