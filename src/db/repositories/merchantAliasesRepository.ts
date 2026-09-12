import {createId, nowIso} from '../../lib/id';

import {Repository} from './Repository';

import type {SqlDatabase} from '../types';

export type MerchantAliasRow = {
  id: string;
  raw_merchant: string;
  display_merchant: string;
  category_id: string | null;
  hit_count: number;
  updated_at: string;
};

function mapAlias(row: Record<string, string | number | boolean | null>): MerchantAliasRow {
  return {
    id: String(row.id),
    raw_merchant: String(row.raw_merchant),
    display_merchant: String(row.display_merchant),
    category_id: row.category_id == null ? null : String(row.category_id),
    hit_count: Number(row.hit_count),
    updated_at: String(row.updated_at),
  };
}

export type CreateMerchantAliasInput = {
  rawMerchant: string;
  displayMerchant: string;
  categoryId?: string | null;
};

export type UpdateMerchantAliasInput = {
  rawMerchant?: string;
  displayMerchant?: string;
  categoryId?: string | null;
};

export class MerchantAliasesRepository extends Repository {
  constructor(db: SqlDatabase) {
    super(db);
  }

  async list(): Promise<MerchantAliasRow[]> {
    const result = await this.query(
      `SELECT * FROM merchant_aliases
       ORDER BY updated_at DESC, raw_merchant COLLATE NOCASE ASC`,
    );
    return result.rows.map(mapAlias);
  }

  async getById(id: string): Promise<MerchantAliasRow | null> {
    const result = await this.query(`SELECT * FROM merchant_aliases WHERE id = ?`, [
      id,
    ]);
    const row = result.rows[0];
    return row ? mapAlias(row) : null;
  }

  async getByRaw(rawMerchant: string): Promise<MerchantAliasRow | null> {
    const result = await this.query(
      `SELECT * FROM merchant_aliases WHERE raw_merchant = ?`,
      [rawMerchant],
    );
    const row = result.rows[0];
    return row ? mapAlias(row) : null;
  }

  async create(input: CreateMerchantAliasInput): Promise<MerchantAliasRow> {
    const raw = input.rawMerchant.trim();
    const display = input.displayMerchant.trim();
    if (!raw || !display) {
      throw new Error('Raw and display merchant required');
    }
    const existing = await this.getByRaw(raw);
    if (existing) {
      throw new Error('An alias for that raw merchant already exists');
    }
    const id = createId();
    const stamped = nowIso();
    await this.run(
      'merchant_aliases',
      `INSERT INTO merchant_aliases (
        id, raw_merchant, display_merchant, category_id, hit_count, updated_at
      ) VALUES (?, ?, ?, ?, 0, ?)`,
      [id, raw, display, input.categoryId ?? null, stamped],
      [id],
    );
    const created = await this.getById(id);
    if (!created) {
      throw new Error('Failed to create merchant alias');
    }
    return created;
  }

  async update(id: string, input: UpdateMerchantAliasInput): Promise<MerchantAliasRow> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Merchant alias not found');
    }
    const raw =
      input.rawMerchant !== undefined ? input.rawMerchant.trim() : existing.raw_merchant;
    const display =
      input.displayMerchant !== undefined
        ? input.displayMerchant.trim()
        : existing.display_merchant;
    if (!raw || !display) {
      throw new Error('Raw and display merchant required');
    }
    if (raw !== existing.raw_merchant) {
      const clash = await this.getByRaw(raw);
      if (clash && clash.id !== id) {
        throw new Error('An alias for that raw merchant already exists');
      }
    }
    const stamped = nowIso();
    await this.run(
      'merchant_aliases',
      `UPDATE merchant_aliases SET
        raw_merchant = ?,
        display_merchant = ?,
        category_id = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        raw,
        display,
        input.categoryId !== undefined ? input.categoryId : existing.category_id,
        stamped,
        id,
      ],
      [id],
    );
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Failed to update merchant alias');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.run(
      'merchant_aliases',
      `DELETE FROM merchant_aliases WHERE id = ?`,
      [id],
      [id],
    );
  }

  async upsert(input: {
    rawMerchant: string;
    displayMerchant: string;
    categoryId?: string | null;
  }): Promise<MerchantAliasRow> {
    const existing = await this.getByRaw(input.rawMerchant);
    const stamped = nowIso();
    if (existing) {
      await this.run(
        'merchant_aliases',
        `UPDATE merchant_aliases SET
          display_merchant = ?,
          category_id = COALESCE(?, category_id),
          hit_count = hit_count + 1,
          updated_at = ?
         WHERE id = ?`,
        [
          input.displayMerchant,
          input.categoryId ?? null,
          stamped,
          existing.id,
        ],
        [existing.id],
      );
      const updated = await this.getByRaw(input.rawMerchant);
      if (!updated) {
        throw new Error('Failed to update merchant alias');
      }
      return updated;
    }

    const id = createId();
    await this.run(
      'merchant_aliases',
      `INSERT INTO merchant_aliases (
        id, raw_merchant, display_merchant, category_id, hit_count, updated_at
      ) VALUES (?, ?, ?, ?, 1, ?)`,
      [
        id,
        input.rawMerchant,
        input.displayMerchant,
        input.categoryId ?? null,
        stamped,
      ],
      [id],
    );
    const created = await this.getByRaw(input.rawMerchant);
    if (!created) {
      throw new Error('Failed to create merchant alias');
    }
    return created;
  }

  async listMerchantCategoryHistory(
    merchant: string,
    limit = 80,
  ): Promise<Array<{merchant: string; categoryId: string}>> {
    const trimmed = merchant.trim();
    if (!trimmed) {
      return [];
    }
    const result = await this.query(
      `SELECT merchant, category_id
       FROM transactions
       WHERE deleted_at IS NULL
         AND merchant IS NOT NULL
         AND category_id IS NOT NULL
         AND (
           lower(merchant) = lower(?)
           OR lower(merchant) LIKE '%' || lower(?) || '%'
         )
       ORDER BY occurred_at DESC
       LIMIT ?`,
      [trimmed, trimmed, limit],
    );
    return result.rows
      .filter(row => row.category_id != null && row.merchant != null)
      .map(row => ({
        merchant: String(row.merchant),
        categoryId: String(row.category_id),
      }));
  }

  /** Recent merchant→category pairs for smart fuzzy matching. */
  async listRecentMerchantCategories(
    limit = 200,
  ): Promise<Array<{merchant: string; categoryId: string}>> {
    const result = await this.query(
      `SELECT merchant, category_id
       FROM transactions
       WHERE deleted_at IS NULL
         AND merchant IS NOT NULL
         AND category_id IS NOT NULL
       ORDER BY occurred_at DESC
       LIMIT ?`,
      [limit],
    );
    return result.rows
      .filter(row => row.category_id != null && row.merchant != null)
      .map(row => ({
        merchant: String(row.merchant),
        categoryId: String(row.category_id),
      }));
  }
}
