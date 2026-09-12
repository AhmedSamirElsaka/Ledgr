import {createId, nowIso} from '../../lib/id';

import {Repository} from './Repository';

import type {SqlDatabase} from '../types';

export type FxRateRow = {
  id: string;
  base_currency: string;
  quote_currency: string;
  rate: number;
  updated_at: string;
};

export type UpsertFxRateInput = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
};

export class MissingFxRateError extends Error {
  readonly code = 'missing_fx_rate';

  constructor(readonly quoteCurrency: string, readonly baseCurrency: string) {
    super(
      `No FX rate is configured for ${quoteCurrency} to ${baseCurrency}. Add the rate before saving.`,
    );
    this.name = 'MissingFxRateError';
  }
}

export class InvalidFxRateError extends Error {
  readonly code = 'invalid_fx_rate';

  constructor(readonly quoteCurrency: string, readonly baseCurrency: string) {
    super(`The FX rate for ${quoteCurrency} to ${baseCurrency} must be a positive number.`);
    this.name = 'InvalidFxRateError';
  }
}

type FxRateReader = Pick<FxRatesRepository, 'getRate'>;

/**
 * Resolves the multiplier used to convert quote minor units into base minor units.
 * Stored rates follow `1 quote = rate base`; an inverse row is accepted as a fallback.
 */
export async function resolveFxRateToBase(
  fxRates: FxRateReader,
  quoteCurrency: string,
  baseCurrency: string,
): Promise<number> {
  if (quoteCurrency === baseCurrency) {
    return 1;
  }

  const direct = await fxRates.getRate(baseCurrency, quoteCurrency);
  if (direct != null) {
    if (!Number.isFinite(direct) || direct <= 0) {
      throw new InvalidFxRateError(quoteCurrency, baseCurrency);
    }
    return direct;
  }

  const inverse = await fxRates.getRate(quoteCurrency, baseCurrency);
  if (inverse != null) {
    if (!Number.isFinite(inverse) || inverse <= 0) {
      throw new InvalidFxRateError(quoteCurrency, baseCurrency);
    }
    return 1 / inverse;
  }

  throw new MissingFxRateError(quoteCurrency, baseCurrency);
}

function mapFx(row: Record<string, string | number | boolean | null>): FxRateRow {
  return {
    id: String(row.id),
    base_currency: String(row.base_currency),
    quote_currency: String(row.quote_currency),
    rate: Number(row.rate),
    updated_at: String(row.updated_at),
  };
}

export class FxRatesRepository extends Repository {
  constructor(db: SqlDatabase) {
    super(db);
  }

  async listAll(): Promise<FxRateRow[]> {
    const result = await this.query(`SELECT * FROM fx_rates ORDER BY quote_currency ASC`);
    return result.rows.map(mapFx);
  }

  async getRate(base: string, quote: string): Promise<number | null> {
    if (base === quote) {
      return 1;
    }
    const result = await this.query(
      `SELECT rate FROM fx_rates WHERE base_currency = ? AND quote_currency = ?`,
      [base, quote],
    );
    const row = result.rows[0];
    return row ? Number(row.rate) : null;
  }

  async upsert(input: UpsertFxRateInput): Promise<FxRateRow> {
    if (!Number.isFinite(input.rate) || input.rate <= 0) {
      throw new InvalidFxRateError(input.quoteCurrency, input.baseCurrency);
    }
    const stamped = nowIso();
    const existing = await this.query(
      `SELECT id FROM fx_rates WHERE base_currency = ? AND quote_currency = ?`,
      [input.baseCurrency, input.quoteCurrency],
    );
    const existingId = existing.rows[0]?.id;

    if (existingId != null) {
      const id = String(existingId);
      await this.run(
        'fx_rates',
        `UPDATE fx_rates SET rate = ?, updated_at = ? WHERE id = ?`,
        [input.rate, stamped, id],
        [id],
      );
      const updated = await this.query(`SELECT * FROM fx_rates WHERE id = ?`, [id]);
      const row = updated.rows[0];
      if (!row) {
        throw new Error('Failed to update FX rate');
      }
      return mapFx(row);
    }

    const id = createId();
    await this.run(
      'fx_rates',
      `INSERT INTO fx_rates (id, base_currency, quote_currency, rate, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, input.baseCurrency, input.quoteCurrency, input.rate, stamped],
      [id],
    );
    const created = await this.query(`SELECT * FROM fx_rates WHERE id = ?`, [id]);
    const row = created.rows[0];
    if (!row) {
      throw new Error('Failed to create FX rate');
    }
    return mapFx(row);
  }

  async remove(id: string): Promise<void> {
    await this.run('fx_rates', `DELETE FROM fx_rates WHERE id = ?`, [id], [id]);
  }
}
