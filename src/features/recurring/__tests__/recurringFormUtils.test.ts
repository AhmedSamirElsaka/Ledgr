import {
  asRecurringCurrency,
  majorAmountFromMinor,
} from '../hooks/recurringFormUtils';

describe('recurringFormUtils', () => {
  it('falls back currency to EGP', () => {
    expect(asRecurringCurrency('EUR')).toBe('EUR');
    expect(asRecurringCurrency('bad')).toBe('EGP');
  });

  it('formats major amounts by exponent', () => {
    expect(majorAmountFromMinor(9900, 'EGP')).toBe('99');
    expect(majorAmountFromMinor(99, 'JPY')).toBe('99');
  });
});
