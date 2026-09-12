import {InvalidFxRateError, MissingFxRateError, resolveFxRateToBase} from '../fxRatesRepository';

describe('resolveFxRateToBase', () => {
  it('uses the configured quote-to-base multiplier', async () => {
    const getRate = jest.fn(async (base: string, quote: string) =>
      base === 'EGP' && quote === 'USD' ? 48.5 : null,
    );

    await expect(resolveFxRateToBase({getRate}, 'USD', 'EGP')).resolves.toBe(48.5);
    expect(getRate).toHaveBeenCalledWith('EGP', 'USD');
  });

  it('uses a reciprocal only when the stored pair is reversed', async () => {
    const getRate = jest.fn(async (base: string, quote: string) =>
      base === 'USD' && quote === 'EGP' ? 0.02 : null,
    );

    await expect(resolveFxRateToBase({getRate}, 'USD', 'EGP')).resolves.toBe(50);
    expect(getRate).toHaveBeenNthCalledWith(1, 'EGP', 'USD');
    expect(getRate).toHaveBeenNthCalledWith(2, 'USD', 'EGP');
  });

  it('returns one without querying for the base currency', async () => {
    const getRate = jest.fn(async () => null);

    await expect(resolveFxRateToBase({getRate}, 'EGP', 'EGP')).resolves.toBe(1);
    expect(getRate).not.toHaveBeenCalled();
  });

  it('throws a typed, user-readable error when no rate exists', async () => {
    const getRate = jest.fn(async () => null);

    const promise = resolveFxRateToBase({getRate}, 'USD', 'EGP');
    await expect(promise).rejects.toBeInstanceOf(MissingFxRateError);
    await expect(promise).rejects.toMatchObject({
      code: 'missing_fx_rate',
      message: 'No FX rate is configured for USD to EGP. Add the rate before saving.',
    });
  });

  it('rejects invalid configured rates', async () => {
    const getRate = jest.fn(async () => 0);

    await expect(resolveFxRateToBase({getRate}, 'USD', 'EGP')).rejects.toBeInstanceOf(
      InvalidFxRateError,
    );
  });
});
