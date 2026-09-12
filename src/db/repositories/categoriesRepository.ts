import {createId, nowIso} from '../../lib/id';

import {Repository} from './Repository';

import type {SqlDatabase} from '../types';

export type CategoryKind = 'expense' | 'income';

export type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: CategoryKind;
  parent_id: string | null;
  sort_order: number;
  archived: number;
  created_at: string;
  updated_at: string;
};

export type CreateCategoryInput = {
  name: string;
  icon: string;
  color: string;
  kind: CategoryKind;
  parentId?: string | null;
  sortOrder?: number;
};

export type UpdateCategoryInput = {
  name?: string;
  icon?: string;
  color?: string;
  kind?: CategoryKind;
  parentId?: string | null;
  sortOrder?: number;
  archived?: boolean;
};

function mapCategory(row: Record<string, string | number | boolean | null>): CategoryRow {
  return {
    id: String(row.id),
    name: String(row.name),
    icon: String(row.icon),
    color: String(row.color),
    kind: row.kind === 'income' ? 'income' : 'expense',
    parent_id: row.parent_id == null ? null : String(row.parent_id),
    sort_order: Number(row.sort_order),
    archived: Number(row.archived),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export class CategoriesRepository extends Repository {
  constructor(db: SqlDatabase) {
    super(db);
  }

  async listActive(kind?: CategoryKind): Promise<CategoryRow[]> {
    if (kind) {
      const result = await this.query(
        `SELECT * FROM categories
         WHERE archived = 0 AND kind = ?
         ORDER BY sort_order ASC, name ASC`,
        [kind],
      );
      return result.rows.map(mapCategory);
    }
    const result = await this.query(
      `SELECT * FROM categories
       WHERE archived = 0
       ORDER BY sort_order ASC, name ASC`,
    );
    return result.rows.map(mapCategory);
  }

  /** Seed order first, then most-used categories bubbled up for the picker. */
  async listForPicker(kind: CategoryKind): Promise<CategoryRow[]> {
    const result = await this.query(
      `SELECT c.*,
         COALESCE((
           SELECT COUNT(*) FROM transactions t
           WHERE t.category_id = c.id AND t.deleted_at IS NULL
         ), 0) AS use_count
       FROM categories c
       WHERE c.archived = 0 AND c.kind = ?
       ORDER BY use_count DESC, c.sort_order ASC, c.name ASC`,
      [kind],
    );
    return result.rows.map(mapCategory);
  }

  async getById(id: string): Promise<CategoryRow | null> {
    const result = await this.query(`SELECT * FROM categories WHERE id = ?`, [id]);
    const row = result.rows[0];
    return row ? mapCategory(row) : null;
  }

  async create(input: CreateCategoryInput): Promise<CategoryRow> {
    const id = createId();
    const stamped = nowIso();
    await this.run(
      'categories',
      `INSERT INTO categories (
        id, name, icon, color, kind, parent_id, sort_order, archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id,
        input.name,
        input.icon,
        input.color,
        input.kind,
        input.parentId ?? null,
        input.sortOrder ?? 999,
        stamped,
        stamped,
      ],
      [id],
    );
    const created = await this.getById(id);
    if (!created) {
      throw new Error('Failed to create category');
    }
    return created;
  }

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryRow> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Category not found');
    }
    const stamped = nowIso();
    await this.run(
      'categories',
      `UPDATE categories SET
        name = ?,
        icon = ?,
        color = ?,
        kind = ?,
        parent_id = ?,
        sort_order = ?,
        archived = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        input.name ?? existing.name,
        input.icon ?? existing.icon,
        input.color ?? existing.color,
        input.kind ?? existing.kind,
        input.parentId !== undefined ? input.parentId : existing.parent_id,
        input.sortOrder ?? existing.sort_order,
        input.archived !== undefined ? (input.archived ? 1 : 0) : existing.archived,
        stamped,
        id,
      ],
      [id],
    );
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Failed to update category');
    }
    return updated;
  }

  async archive(id: string): Promise<void> {
    await this.update(id, {archived: true});
  }

  /** Apply sibling sort_order patches without changing parent_id. */
  async applySortOrders(
    patches: readonly {id: string; sortOrder: number}[],
  ): Promise<void> {
    for (const patch of patches) {
      await this.update(patch.id, {sortOrder: patch.sortOrder});
    }
  }
}
