import {
  countActiveFilters,
  EMPTY_TX_FILTERS,
  resolveDateBounds,
  toListFilter,
} from '../transactionFilters';

describe('transactionFilters', () => {
  it('counts active filters', () => {
    expect(countActiveFilters(EMPTY_TX_FILTERS)).toBe(0);
    expect(
      countActiveFilters({
        ...EMPTY_TX_FILTERS,
        type: 'expense',
        source: 'sms',
        datePreset: 'month',
        minAmountMajor: '10',
      }),
    ).toBe(4);
  });

  it('resolves preset date bounds', () => {
    const all = resolveDateBounds(EMPTY_TX_FILTERS);
    expect(all.fromIso).toBeUndefined();
    expect(all.toIso).toBeUndefined();

    const week = resolveDateBounds({...EMPTY_TX_FILTERS, datePreset: 'week'});
    expect(week.fromIso).toBeTruthy();
    expect(week.toIso).toBeTruthy();
  });

  it('maps to list filter including amount and source', () => {
    const filter = toListFilter(
      {
        ...EMPTY_TX_FILTERS,
        source: 'sms',
        accountId: 'acc-1',
        minAmountMajor: '10',
        maxAmountMajor: '100',
        datePreset: 'custom',
        customFrom: '2026-01-01',
        customTo: '2026-01-31',
      },
      'coffee',
      50,
      'EGP',
    );
    expect(filter.source).toBe('sms');
    expect(filter.accountId).toBe('acc-1');
    expect(filter.search).toBe('coffee');
    expect(filter.limit).toBe(50);
    expect(filter.minAmountMinor).toBe(1000);
    expect(filter.maxAmountMinor).toBe(10000);
    expect(filter.fromIso).toBeTruthy();
    expect(filter.toIso).toBeTruthy();
    const from = new Date(filter.fromIso!);
    const to = new Date(filter.toIso!);
    expect(from.getFullYear()).toBe(2026);
    expect(from.getMonth()).toBe(0);
    expect(from.getDate()).toBe(1);
    expect(to.getFullYear()).toBe(2026);
    expect(to.getMonth()).toBe(0);
    expect(to.getDate()).toBe(31);
  });
});
