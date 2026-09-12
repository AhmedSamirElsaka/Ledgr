import {createId, nowIso} from '../../lib/id';

import {Repository} from './Repository';

import type {SqlDatabase} from '../types';

export type BudgetPeriod = 'weekly' | 'monthly' | 'custom';

export type BudgetRow = {
  id: string;
  category_id: string | null;
  period: BudgetPeriod;
  amount_minor: number;
  currency: string;
  rollover: number;
  start_date: string;
  end_date: string | null;
  active: number;
  created_at: string;
  updated_at: string;
};

export type CreateBudgetInput = {
  categoryId?: string | null;
  period: BudgetPeriod;
  amountMinor: number;
  currency: string;
  rollover?: boolean;
  startDate: string;
  endDate?: string | null;
};

export type UpdateBudgetInput = {
  categoryId?: string | null;
  period?: BudgetPeriod;
  amountMinor?: number;
  currency?: string;
  rollover?: boolean;
  startDate?: string;
  endDate?: string | null;
  active?: boolean;
};

function mapBudget(row: Record<string, string | number | boolean | null>): BudgetRow {
  const period = String(row.period);
  return {
    id: String(row.id),
    category_id: row.category_id == null ? null : String(row.category_id),
    period:
      period === 'weekly' || period === 'monthly' || period === 'custom'
        ? period
        : 'monthly',
    amount_minor: Number(row.amount_minor),
    currency: String(row.currency),
    rollover: Number(row.rollover),
    start_date: String(row.start_date),
    end_date: row.end_date == null ? null : String(row.end_date),
    active: Number(row.active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export class BudgetsRepository extends Repository {
  constructor(db: SqlDatabase) {
    super(db);
  }

  async listActive(): Promise<BudgetRow[]> {
    const result = await this.query(
      `SELECT * FROM budgets WHERE active = 1 ORDER BY start_date DESC`,
    );
    return result.rows.map(mapBudget);
  }

  async getById(id: string): Promise<BudgetRow | null> {
    const result = await this.query(`SELECT * FROM budgets WHERE id = ?`, [id]);
    const row = result.rows[0];
    return row ? mapBudget(row) : null;
  }

  async findActiveForCategory(categoryId: string): Promise<BudgetRow | null> {
    const result = await this.query(
      `SELECT * FROM budgets
       WHERE active = 1 AND category_id = ?
       ORDER BY start_date DESC
       LIMIT 1`,
      [categoryId],
    );
    const row = result.rows[0];
    return row ? mapBudget(row) : null;
  }

  async create(input: CreateBudgetInput): Promise<BudgetRow> {
    const id = createId();
    const stamped = nowIso();
    await this.run(
      'budgets',
      `INSERT INTO budgets (
        id, category_id, period, amount_minor, currency, rollover,
        start_date, end_date, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        input.categoryId ?? null,
        input.period,
        input.amountMinor,
        input.currency,
        input.rollover ? 1 : 0,
        input.startDate,
        input.endDate ?? null,
        stamped,
        stamped,
      ],
      [id],
    );
    const created = await this.getById(id);
    if (!created) {
      throw new Error('Failed to create budget');
    }
    return created;
  }

  async update(id: string, input: UpdateBudgetInput): Promise<BudgetRow> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Budget not found');
    }
    const stamped = nowIso();
    await this.run(
      'budgets',
      `UPDATE budgets SET
        category_id = ?,
        period = ?,
        amount_minor = ?,
        currency = ?,
        rollover = ?,
        start_date = ?,
        end_date = ?,
        active = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        input.categoryId !== undefined ? input.categoryId : existing.category_id,
        input.period ?? existing.period,
        input.amountMinor ?? existing.amount_minor,
        input.currency ?? existing.currency,
        input.rollover !== undefined ? (input.rollover ? 1 : 0) : existing.rollover,
        input.startDate ?? existing.start_date,
        input.endDate !== undefined ? input.endDate : existing.end_date,
        input.active !== undefined ? (input.active ? 1 : 0) : existing.active,
        stamped,
        id,
      ],
      [id],
    );
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Failed to update budget');
    }
    return updated;
  }

  async deactivate(id: string): Promise<void> {
    await this.update(id, {active: false});
  }

  /** Sum of expense base amounts for a category in [startIso, endIso]. */
  async sumSpentInPeriod(
    categoryId: string | null,
    startIso: string,
    endIso: string,
  ): Promise<number> {
    const result = categoryId
      ? await this.query(
          `SELECT COALESCE(SUM(ABS(base_amount_minor)), 0) AS total
           FROM transactions
           WHERE deleted_at IS NULL
             AND type = 'expense'
             AND category_id = ?
             AND occurred_at >= ?
             AND occurred_at <= ?`,
          [categoryId, startIso, endIso],
        )
      : await this.query(
          `SELECT COALESCE(SUM(ABS(base_amount_minor)), 0) AS total
           FROM transactions
           WHERE deleted_at IS NULL
             AND type = 'expense'
             AND occurred_at >= ?
             AND occurred_at <= ?`,
          [startIso, endIso],
        );
    return Number(result.rows[0]?.total ?? 0);
  }
}
