import {
  predictNextDueDate,
  toMonthlyMinor,
  toYearlyMinor,
  type SubscriptionCycle,
} from '../../domain/subscriptions/cycle';
import {createId, nowIso} from '../../lib/id';

import {Repository} from './Repository';

import type {SqlDatabase} from '../types';

export type SubscriptionStatus = 'active' | 'cancelled' | 'paused';

export type SubscriptionRow = {
  id: string;
  name: string;
  merchant_matcher: string | null;
  amount_minor: number;
  currency: string;
  cycle: SubscriptionCycle;
  custom_days: number | null;
  next_due_date: string;
  account_id: string | null;
  category_id: string | null;
  reminder_days_before: number;
  status: SubscriptionStatus;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateSubscriptionInput = {
  name: string;
  merchantMatcher?: string | null;
  amountMinor: number;
  currency: string;
  cycle: SubscriptionCycle;
  customDays?: number | null;
  nextDueDate: string;
  accountId?: string | null;
  categoryId?: string | null;
  reminderDaysBefore?: number;
  icon?: string | null;
  color?: string | null;
};

export type UpdateSubscriptionInput = Partial<CreateSubscriptionInput> & {
  status?: SubscriptionStatus;
};

function mapCycle(raw: string): SubscriptionCycle {
  if (raw === 'yearly' || raw === 'custom' || raw === 'monthly') {
    return raw;
  }
  return 'monthly';
}

function mapStatus(raw: string): SubscriptionStatus {
  if (raw === 'cancelled' || raw === 'paused' || raw === 'active') {
    return raw;
  }
  return 'active';
}

function mapSub(row: Record<string, string | number | boolean | null>): SubscriptionRow {
  return {
    id: String(row.id),
    name: String(row.name),
    merchant_matcher: row.merchant_matcher == null ? null : String(row.merchant_matcher),
    amount_minor: Number(row.amount_minor),
    currency: String(row.currency),
    cycle: mapCycle(String(row.cycle)),
    custom_days: row.custom_days == null ? null : Number(row.custom_days),
    next_due_date: String(row.next_due_date),
    account_id: row.account_id == null ? null : String(row.account_id),
    category_id: row.category_id == null ? null : String(row.category_id),
    reminder_days_before: Number(row.reminder_days_before),
    status: mapStatus(String(row.status)),
    icon: row.icon == null ? null : String(row.icon),
    color: row.color == null ? null : String(row.color),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export class SubscriptionsRepository extends Repository {
  constructor(db: SqlDatabase) {
    super(db);
  }

  async listAll(): Promise<SubscriptionRow[]> {
    const result = await this.query(
      `SELECT * FROM subscriptions ORDER BY status ASC, next_due_date ASC`,
    );
    return result.rows.map(mapSub);
  }

  async listActive(): Promise<SubscriptionRow[]> {
    const result = await this.query(
      `SELECT * FROM subscriptions WHERE status = 'active' ORDER BY next_due_date ASC`,
    );
    return result.rows.map(mapSub);
  }

  async getById(id: string): Promise<SubscriptionRow | null> {
    const result = await this.query(`SELECT * FROM subscriptions WHERE id = ?`, [id]);
    const row = result.rows[0];
    return row ? mapSub(row) : null;
  }

  async create(input: CreateSubscriptionInput): Promise<SubscriptionRow> {
    const id = createId();
    const stamped = nowIso();
    await this.run(
      'subscriptions',
      `INSERT INTO subscriptions (
        id, name, merchant_matcher, amount_minor, currency, cycle, custom_days,
        next_due_date, account_id, category_id, reminder_days_before, status,
        icon, color, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.merchantMatcher ?? null,
        input.amountMinor,
        input.currency,
        input.cycle,
        input.customDays ?? null,
        input.nextDueDate,
        input.accountId ?? null,
        input.categoryId ?? null,
        input.reminderDaysBefore ?? 3,
        input.icon ?? null,
        input.color ?? null,
        stamped,
        stamped,
      ],
      [id],
    );
    const created = await this.getById(id);
    if (!created) {
      throw new Error('Failed to create subscription');
    }
    return created;
  }

  async update(id: string, input: UpdateSubscriptionInput): Promise<SubscriptionRow> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Subscription not found');
    }
    const stamped = nowIso();
    await this.run(
      'subscriptions',
      `UPDATE subscriptions SET
        name = ?,
        merchant_matcher = ?,
        amount_minor = ?,
        currency = ?,
        cycle = ?,
        custom_days = ?,
        next_due_date = ?,
        account_id = ?,
        category_id = ?,
        reminder_days_before = ?,
        status = ?,
        icon = ?,
        color = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        input.name ?? existing.name,
        input.merchantMatcher !== undefined
          ? input.merchantMatcher
          : existing.merchant_matcher,
        input.amountMinor ?? existing.amount_minor,
        input.currency ?? existing.currency,
        input.cycle ?? existing.cycle,
        input.customDays !== undefined ? input.customDays : existing.custom_days,
        input.nextDueDate ?? existing.next_due_date,
        input.accountId !== undefined ? input.accountId : existing.account_id,
        input.categoryId !== undefined ? input.categoryId : existing.category_id,
        input.reminderDaysBefore ?? existing.reminder_days_before,
        input.status ?? existing.status,
        input.icon !== undefined ? input.icon : existing.icon,
        input.color !== undefined ? input.color : existing.color,
        stamped,
        id,
      ],
      [id],
    );
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Failed to update subscription');
    }
    return updated;
  }

  /** Cancel keeps history (status cancelled). */
  async cancel(id: string): Promise<void> {
    await this.update(id, {status: 'cancelled'});
  }

  async advanceNextDue(id: string, from: Date = new Date()): Promise<SubscriptionRow> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Subscription not found');
    }
    const next = predictNextDueDate(
      existing.next_due_date,
      existing.cycle,
      existing.custom_days,
      from,
    );
    return this.update(id, {nextDueDate: next});
  }

  totalsForActive(): Promise<{monthlyMinor: number; yearlyMinor: number}> {
    return this.listActive().then(rows => {
      let monthly = 0;
      for (const row of rows) {
        monthly += toMonthlyMinor(row.amount_minor, row.cycle, row.custom_days);
      }
      return {monthlyMinor: monthly, yearlyMinor: monthly * 12};
    });
  }

  /**
   * Detect recurring merchants from history: same merchant, similar amount,
   * ~30 or ~365 day gaps, appearing ≥3 times.
   */
  async detectFromHistory(): Promise<
    Array<{
      merchant: string;
      amountMinor: number;
      currency: string;
      cycle: SubscriptionCycle;
      occurrences: number;
    }>
  > {
    const result = await this.query(
      `SELECT merchant, currency, amount_minor, occurred_at
       FROM transactions
       WHERE deleted_at IS NULL
         AND type = 'expense'
         AND merchant IS NOT NULL
         AND merchant != ''
       ORDER BY merchant ASC, occurred_at ASC`,
    );

    type Bucket = {
      merchant: string;
      currency: string;
      amounts: number[];
      dates: number[];
    };

    const buckets = new Map<string, Bucket>();
    for (const row of result.rows) {
      const merchant = String(row.merchant);
      const currency = String(row.currency);
      const key = `${merchant.toLowerCase()}|${currency}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {merchant, currency, amounts: [], dates: []};
        buckets.set(key, bucket);
      }
      bucket.amounts.push(Math.abs(Number(row.amount_minor)));
      bucket.dates.push(Date.parse(String(row.occurred_at)));
    }

    const detected: Array<{
      merchant: string;
      amountMinor: number;
      currency: string;
      cycle: SubscriptionCycle;
      occurrences: number;
    }> = [];

    for (const bucket of buckets.values()) {
      if (bucket.dates.length < 3) {
        continue;
      }
      const medianAmount = median(bucket.amounts);
      const similar = bucket.amounts.filter(
        a => Math.abs(a - medianAmount) <= medianAmount * 0.15,
      );
      if (similar.length < 3) {
        continue;
      }

      const gaps: number[] = [];
      for (let i = 1; i < bucket.dates.length; i++) {
        const prev = bucket.dates[i - 1];
        const curr = bucket.dates[i];
        if (prev === undefined || curr === undefined) {
          continue;
        }
        gaps.push((curr - prev) / (1000 * 60 * 60 * 24));
      }
      const medianGap = median(gaps);
      let cycle: SubscriptionCycle | null = null;
      if (medianGap >= 25 && medianGap <= 35) {
        cycle = 'monthly';
      } else if (medianGap >= 350 && medianGap <= 380) {
        cycle = 'yearly';
      }
      if (!cycle) {
        continue;
      }

      const existing = await this.query(
        `SELECT id FROM subscriptions
         WHERE status != 'cancelled'
           AND lower(COALESCE(merchant_matcher, name)) = lower(?)
         LIMIT 1`,
        [bucket.merchant],
      );
      if (existing.rows.length > 0) {
        continue;
      }

      detected.push({
        merchant: bucket.merchant,
        amountMinor: Math.round(medianAmount),
        currency: bucket.currency,
        cycle,
        occurrences: similar.length,
      });
    }

    return detected;
  }
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const a = sorted[mid];
  if (a === undefined) {
    return 0;
  }
  if (sorted.length % 2 === 1) {
    return a;
  }
  const b = sorted[mid - 1];
  return ((b ?? a) + a) / 2;
}

export {toMonthlyMinor, toYearlyMinor};
