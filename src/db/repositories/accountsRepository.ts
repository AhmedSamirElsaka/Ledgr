import {createId, nowIso} from '../../lib/id';

import {Repository} from './Repository';

import type {CurrencyCode} from '../../domain/money/Money';
import type {SqlDatabase} from '../types';

export type AccountType = 'cash' | 'bank' | 'card' | 'wallet';

export type AccountRow = {
  id: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode | string;
  opening_balance_minor: number;
  color: string;
  icon: string;
  archived: number;
  created_at: string;
  updated_at: string;
};

export type AccountWithBalance = AccountRow & {
  balance_minor: number;
};

export type CreateAccountInput = {
  name: string;
  type: AccountType;
  currency: string;
  openingBalanceMinor?: number;
  color: string;
  icon: string;
};

export type UpdateAccountInput = {
  name?: string;
  type?: AccountType;
  currency?: string;
  openingBalanceMinor?: number;
  color?: string;
  icon?: string;
  archived?: boolean;
};

function mapAccount(row: Record<string, string | number | boolean | null>): AccountRow {
  const type = String(row.type);
  return {
    id: String(row.id),
    name: String(row.name),
    type:
      type === 'bank' || type === 'card' || type === 'wallet' || type === 'cash'
        ? type
        : 'cash',
    currency: String(row.currency),
    opening_balance_minor: Number(row.opening_balance_minor),
    color: String(row.color),
    icon: String(row.icon),
    archived: Number(row.archived),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export class AccountsRepository extends Repository {
  constructor(db: SqlDatabase) {
    super(db);
  }

  async listActive(): Promise<AccountRow[]> {
    const result = await this.query(
      `SELECT * FROM accounts WHERE archived = 0 ORDER BY name ASC`,
    );
    return result.rows.map(mapAccount);
  }

  async listWithBalances(): Promise<AccountWithBalance[]> {
    const result = await this.query(
      `SELECT a.*,
        a.opening_balance_minor + COALESCE((
          SELECT SUM(
            CASE t.type
              WHEN 'income' THEN ABS(t.amount_minor)
              WHEN 'expense' THEN -ABS(t.amount_minor)
              WHEN 'transfer' THEN t.amount_minor
              ELSE 0
            END
          )
          FROM transactions t
          WHERE t.account_id = a.id AND t.deleted_at IS NULL
        ), 0) AS balance_minor
       FROM accounts a
       WHERE a.archived = 0
       ORDER BY a.name ASC`,
    );
    return result.rows.map(row => ({
      ...mapAccount(row),
      balance_minor: Number(row.balance_minor),
    }));
  }

  async create(input: CreateAccountInput): Promise<AccountRow> {
    const id = createId();
    const stamped = nowIso();
    await this.run(
      'accounts',
      `INSERT INTO accounts (
        id, name, type, currency, opening_balance_minor, color, icon, archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id,
        input.name,
        input.type,
        input.currency,
        input.openingBalanceMinor ?? 0,
        input.color,
        input.icon,
        stamped,
        stamped,
      ],
      [id],
    );
    const created = await this.getById(id);
    if (!created) {
      throw new Error('Failed to create account');
    }
    return created;
  }

  async update(id: string, input: UpdateAccountInput): Promise<AccountRow> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Account not found');
    }
    const stamped = nowIso();
    await this.run(
      'accounts',
      `UPDATE accounts SET
        name = ?,
        type = ?,
        currency = ?,
        opening_balance_minor = ?,
        color = ?,
        icon = ?,
        archived = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        input.name ?? existing.name,
        input.type ?? existing.type,
        input.currency ?? existing.currency,
        input.openingBalanceMinor ?? existing.opening_balance_minor,
        input.color ?? existing.color,
        input.icon ?? existing.icon,
        input.archived !== undefined ? (input.archived ? 1 : 0) : existing.archived,
        stamped,
        id,
      ],
      [id],
    );
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Failed to update account');
    }
    return updated;
  }

  async archive(id: string): Promise<void> {
    await this.update(id, {archived: true});
  }

  async getById(id: string): Promise<AccountRow | null> {
    const result = await this.query(`SELECT * FROM accounts WHERE id = ?`, [id]);
    const row = result.rows[0];
    return row ? mapAccount(row) : null;
  }

  async countActive(): Promise<number> {
    const result = await this.query(
      `SELECT COUNT(*) AS c FROM accounts WHERE archived = 0`,
    );
    return Number(result.rows[0]?.c ?? 0);
  }
}
