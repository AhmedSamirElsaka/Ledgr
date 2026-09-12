import {
  computeBudgetProgress,
  computeBudgetRemaining,
  getBudgetPeriodBounds,
} from '../period';

describe('getBudgetPeriodBounds', () => {
  const ref = new Date('2026-09-10T12:00:00.000Z');

  it('returns monthly bounds for September', () => {
    const bounds = getBudgetPeriodBounds('monthly', '2026-01-01T00:00:00.000Z', null, ref);
    expect(bounds.start.getUTCFullYear()).toBe(2026);
    expect(bounds.start.getMonth()).toBe(8); // local September
    expect(bounds.end.getMonth()).toBe(8);
  });

  it('returns weekly Mon–Sun window', () => {
    const bounds = getBudgetPeriodBounds('weekly', '2026-01-01T00:00:00.000Z', null, ref);
    // 2026-09-10 is Thursday → week starts Mon 7 Sep
    expect(bounds.start.getDay()).toBe(1);
    expect(bounds.end.getDay()).toBe(0);
  });

  it('uses custom end date when provided', () => {
    const bounds = getBudgetPeriodBounds(
      'custom',
      '2026-09-01T12:00:00.000Z',
      '2026-09-15T12:00:00.000Z',
      ref,
    );
    expect(bounds.start.getDate()).toBe(1);
    expect(bounds.start.getMonth()).toBe(8);
    expect(bounds.end.getDate()).toBe(15);
  });
});

describe('computeBudgetRemaining / progress', () => {
  it('subtracts spend from envelope', () => {
    expect(
      computeBudgetRemaining({
        amountMinor: 10000,
        spentMinor: 2500,
        previousRemainingMinor: 0,
        rollover: false,
      }),
    ).toBe(7500);
  });

  it('adds prior remaining when rollover enabled', () => {
    expect(
      computeBudgetRemaining({
        amountMinor: 10000,
        spentMinor: 2000,
        previousRemainingMinor: 1500,
        rollover: true,
      }),
    ).toBe(9500);
  });

  it('ignores prior remaining when rollover off', () => {
    expect(
      computeBudgetRemaining({
        amountMinor: 10000,
        spentMinor: 2000,
        previousRemainingMinor: 1500,
        rollover: false,
      }),
    ).toBe(8000);
  });

  it('marks over-budget when spent exceeds envelope', () => {
    const result = computeBudgetProgress({
      amountMinor: 5000,
      spentMinor: 6000,
      previousRemainingMinor: 0,
      rollover: false,
    });
    expect(result.overBudget).toBe(true);
    expect(result.remainingMinor).toBe(-1000);
    expect(result.progress).toBe(1);
  });
});
