import {createId, nowIso} from '../../lib/id';
import {emitDbChange} from '../events';

import {Repository} from './Repository';

import type {SqlDatabase} from '../types';

export type TagRow = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type CreateTagInput = {
  name: string;
  color: string;
};

export type UpdateTagInput = {
  name?: string;
  color?: string;
};

function mapTag(row: Record<string, string | number | boolean | null>): TagRow {
  return {
    id: String(row.id),
    name: String(row.name),
    color: String(row.color),
    created_at: String(row.created_at),
  };
}

export class TagsRepository extends Repository {
  constructor(db: SqlDatabase) {
    super(db);
  }

  async list(): Promise<TagRow[]> {
    const result = await this.query(
      `SELECT * FROM tags ORDER BY name COLLATE NOCASE ASC`,
    );
    return result.rows.map(mapTag);
  }

  async getById(id: string): Promise<TagRow | null> {
    const result = await this.query(`SELECT * FROM tags WHERE id = ?`, [id]);
    const row = result.rows[0];
    return row ? mapTag(row) : null;
  }

  async create(input: CreateTagInput): Promise<TagRow> {
    const id = createId();
    const stamped = nowIso();
    const name = input.name.trim();
    if (!name) {
      throw new Error('Tag name required');
    }
    await this.run(
      'tags',
      `INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
      [id, name, input.color, stamped],
      [id],
    );
    const created = await this.getById(id);
    if (!created) {
      throw new Error('Failed to create tag');
    }
    return created;
  }

  async rename(id: string, name: string): Promise<TagRow> {
    return this.update(id, {name});
  }

  async update(id: string, input: UpdateTagInput): Promise<TagRow> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Tag not found');
    }
    const nextName = input.name !== undefined ? input.name.trim() : existing.name;
    if (!nextName) {
      throw new Error('Tag name required');
    }
    await this.run(
      'tags',
      `UPDATE tags SET name = ?, color = ? WHERE id = ?`,
      [nextName, input.color ?? existing.color, id],
      [id],
    );
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Failed to update tag');
    }
    return updated;
  }

  /** Hard delete — schema has no archive column; CASCADE clears transaction_tags. */
  async delete(id: string): Promise<void> {
    await this.run('tags', `DELETE FROM tags WHERE id = ?`, [id], [id]);
  }

  async getTagsForTransaction(transactionId: string): Promise<TagRow[]> {
    const result = await this.query(
      `SELECT t.* FROM tags t
       INNER JOIN transaction_tags tt ON tt.tag_id = t.id
       WHERE tt.transaction_id = ?
       ORDER BY t.name COLLATE NOCASE ASC`,
      [transactionId],
    );
    return result.rows.map(mapTag);
  }

  async setTagsForTransaction(
    transactionId: string,
    tagIds: readonly string[],
  ): Promise<void> {
    const uniqueIds = [...new Set(tagIds)];
    await this.withTransaction(async tx => {
      await tx.execute(`DELETE FROM transaction_tags WHERE transaction_id = ?`, [
        transactionId,
      ]);
      for (const tagId of uniqueIds) {
        await tx.execute(
          `INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`,
          [transactionId, tagId],
        );
      }
    });
    emitDbChange({table: 'transaction_tags', ids: [transactionId, ...uniqueIds]});
  }

  /** Adds a tag to many transactions without removing existing tags. */
  async addTagToMany(
    transactionIds: readonly string[],
    tagId: string,
  ): Promise<void> {
    if (transactionIds.length === 0) {
      return;
    }
    const uniqueTxIds = [...new Set(transactionIds)];
    await this.withTransaction(async tx => {
      for (const transactionId of uniqueTxIds) {
        await tx.execute(
          `INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`,
          [transactionId, tagId],
        );
      }
    });
    emitDbChange({table: 'transaction_tags', ids: [...uniqueTxIds, tagId]});
  }

  async listTransactionIdsByTag(tagId: string): Promise<string[]> {
    const result = await this.query(
      `SELECT transaction_id FROM transaction_tags WHERE tag_id = ?`,
      [tagId],
    );
    return result.rows.map(row => String(row.transaction_id));
  }
}
