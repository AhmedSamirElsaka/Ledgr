import {
  absMoney,
  addMoney,
  formatMoney,
  majorToMinor,
  minorToMajor,
  money,
  negMoney,
  subMoney,
} from '../Money';

describe('Money', () => {
  it('rejects non-integer minor amounts', () => {
    expect(() => money(1.5, 'USD')).toThrow(/integer/);
  });

  it('converts major ↔ minor with currency exponent', () => {
    expect(majorToMinor(10.5, 'USD')).toBe(1050);
    expect(minorToMajor(1050, 'USD')).toBe(10.5);
    expect(majorToMinor(100, 'JPY')).toBe(100);
    expect(majorToMinor(1.234, 'KWD')).toBe(1234);
  });

  it('adds and subtracts same-currency values', () => {
    const a = money(1000, 'EGP');
    const b = money(250, 'EGP');
    expect(addMoney(a, b).amountMinor).toBe(1250);
    expect(subMoney(a, b).amountMinor).toBe(750);
  });

  it('negates and abs', () => {
    expect(negMoney(money(500, 'USD')).amountMinor).toBe(-500);
    expect(absMoney(money(-500, 'USD')).amountMinor).toBe(500);
  });

  it('rejects cross-currency arithmetic', () => {
    expect(() => addMoney(money(1, 'USD'), money(1, 'EGP'))).toThrow(/mismatch/);
  });

  it('formats with symbol placement and tabular-friendly grouping', () => {
    expect(formatMoney(money(128450, 'EGP'))).toContain('E£');
    expect(formatMoney(money(128450, 'EGP'))).toMatch(/1,?284\.50/);
    expect(formatMoney(money(1250, 'JPY'))).toContain('¥');
    expect(formatMoney(money(1250, 'JPY'))).not.toMatch(/\./);
    expect(formatMoney(money(1234, 'KWD'))).toMatch(/1\.234/);
    expect(formatMoney(money(-500, 'USD'))).toMatch(/^−/);
    expect(formatMoney(money(500, 'USD'), {signed: true})).toMatch(/^\+/);
  });
});
