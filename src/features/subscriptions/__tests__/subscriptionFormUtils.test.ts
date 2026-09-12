import {
  asSubscriptionCurrency,
  majorAmountFromMinor,
} from '../hooks/subscriptionFormUtils';

describe('subscriptionFormUtils', () => {
  it('falls back currency to EGP', () => {
    expect(asSubscriptionCurrency('SAR')).toBe('SAR');
    expect(asSubscriptionCurrency('x')).toBe('EGP');
  });

  it('formats major amounts by exponent', () => {
    expect(majorAmountFromMinor(1999, 'EGP')).toBe('19.99');
    expect(majorAmountFromMinor(1999, 'JPY')).toBe('1999');
  });
});
