import {asBudgetCurrency, majorAmountFromMinor} from '../hooks/budgetFormUtils';

describe('budgetFormUtils', () => {
  it('falls back currency to EGP', () => {
    expect(asBudgetCurrency('USD')).toBe('USD');
    expect(asBudgetCurrency('???')).toBe('EGP');
  });

  it('formats major amounts by exponent', () => {
    expect(majorAmountFromMinor(1250, 'EGP')).toBe('12.5');
    expect(majorAmountFromMinor(1250, 'JPY')).toBe('1250');
  });
});
