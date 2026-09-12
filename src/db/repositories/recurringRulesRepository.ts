import {isRecurringCycle, type RecurringCycle} from '../../domain/recurring/cycle';
import {createId, nowIso} from '../../lib/id';

import {Repository} from './Repository';

import type {SqlDatabase} from '../types';

export type RecurringRuleType = 'expense' | 'income';

export type RecurringRuleRow = {
  id: string;
  name: string;
  account_id: string;
  category_id: string | null;
  amount_minor: number;
  currency: string;
  type: RecurringRuleType;
  cycle: RecurringCycle;
  custom_days: number | null;
  next_occurred_at: string;
  note: string | null;
  active: number;
  created_at: string;
  updated_at: string;
};

export type CreateRecurringRuleInput = {
  name: string;
  accountId: string;
  categoryId?: string | null;
  amountMinor: number;
  currency: string;
  type: RecurringRuleType;
  cycle: RecurringCycle;
  customDays?: number | null;
  nextOccurredAt: string;
  note?: string | null;
  active?: boolean;
};

export type UpdateRecurringRuleInput = Partial<CreateRecurringRuleInput>;

function mapType(raw: string): RecurringRuleType {
  return raw === 'income' ? 'income' : 'expense';
}

function mapCycle(raw: string): RecurringCycle {
  return isRecurringCycle(raw) ? raw : 'monthly';
}

function mapRule(row: Record<string, string | number | boolean | null>): RecurringRuleRow {
  return {
    id: String(row.id),
    name: String(row.name),
    account_id: String(row.account_id),
    category_id: row.category_id == null ? null : String(row.category_id),
    amount_minor: Number(row.amount_minor),
    currency: String(row.currency),
    type: mapType(String(row.type)),
    cycle: mapCycle(String(row.cycle)),
    custom_days: row.custom_days == null ? null : Number(row.custom_days),
    next_occurred_at: String(row.next_occurred_at),
    note: row.note == null ? null : String(row.note),
    active: Number(row.active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export class RecurringRulesRepository extends Repository {
  constructor(db: SqlDatabase) {
    super(db);
  }

  async listAll(): Promise<RecurringRuleRow[]> {
    const result = await this.query(
      `SELECT * FROM recurring_rules
       ORDER BY active DESC, next_occurred_at ASC`,
    );
    return result.rows.map(mapRule);
  }

  async listActive(): Promise<RecurringRuleRow[]> {
    const result = await this.query(
      `SELECT * FROM recurring_rules
       WHERE active = 1
       ORDER BY next_occurred_at ASC`,
    );
    return result.rows.map(mapRule);
  }

  /** Active rules whose next occurrence is due at or before `asOfIso`. */
  async listDue(asOfIso: string): Promise<RecurringRuleRow[]> {
    const result = await this.query(
      `SELECT * FROM recurring_rules
       WHERE active = 1 AND next_occurred_at <= ?
       ORDER BY next_occurred_at ASC`,
      [asOfIso],
    );
    return result.rows.map(mapRule);
  }

  async getById(id: string): Promise<RecurringRuleRow | null> {
    const result = await this.query(`SELECT * FROM recurring_rules WHERE id = ?`, [id]);
    const row = result.rows[0];
    return row ? mapRule(row) : null;
  }

  async create(input: CreateRecurringRuleInput): Promise<RecurringRuleRow> {
    const id = createId();
    const stamped = nowIso();
    await this.run(
      'recurring_rules',
      `INSERT INTO recurring_rules (
        id, name, account_id, category_id, amount_minor, currency, type, cycle,
        custom_days, next_occurred_at, note, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.accountId,
        input.categoryId ?? null,
        input.amountMinor,
        input.currency,
        input.type,
        input.cycle,
        input.customDays ?? null,
        input.nextOccurredAt,
        input.note ?? null,
        input.active === false ? 0 : 1,
        stamped,
        stamped,
      ],
      [id],
    );
    const created = await this.getById(id);
    if (!created) {
      throw new Error('Failed to create recurring rule');
    }
    return created;
  }

  async update(id: string, input: UpdateRecurringRuleInput): Promise<RecurringRuleRow> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Recurring rule not found');
    }
    const stamped = nowIso();
    await this.run(
      'recurring_rules',
      `UPDATE recurring_rules SET
        name = ?,
        account_id = ?,
        category_id = ?,
        amount_minor = ?,
        currency = ?,
        type = ?,
        cycle = ?,
        custom_days = ?,
        next_occurred_at = ?,
        note = ?,
        active = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        input.name ?? existing.name,
        input.accountId ?? existing.account_id,
        input.categoryId !== undefined ? input.categoryId : existing.category_id,
        input.amountMinor ?? existing.amount_minor,
        input.currency ?? existing.currency,
        input.type ?? existing.type,
        input.cycle ?? existing.cycle,
        input.customDays !== undefined ? input.customDays : existing.custom_days,
        input.nextOccurredAt ?? existing.next_occurred_at,
        input.note !== undefined ? input.note : existing.note,
        input.active !== undefined ? (input.active ? 1 : 0) : existing.active,
        stamped,
        id,
      ],
      [id],
    );
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Failed to update recurring rule');
    }
    return updated;
  }

  async setActive(id: string, active: boolean): Promise<RecurringRuleRow> {
    return this.update(id, {active});
  }

  async setNextOccurredAt(id: string, nextOccurredAt: string): Promise<RecurringRuleRow> {
    return this.update(id, {nextOccurredAt});
  }

  async remove(id: string): Promise<void> {
    await this.run('recurring_rules', `DELETE FROM recurring_rules WHERE id = ?`, [id], [id]);
  }
}
