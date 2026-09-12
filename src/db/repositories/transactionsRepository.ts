import {createId, nowIso} from '../../lib/id';
import {emitDbChange} from '../events';

import {Repository} from './Repository';

import type {SqlDatabase} from '../types';

export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionSource = 'manual' | 'sms' | 'recurring' | 'import';

export type TransactionRow = {
  id: string;
  account_id: string;
  category_id: string | null;
  amount_minor: number;
  currency: string;
  fx_rate_to_base: number;
  base_amount_minor: number;
  type: TransactionType;
  transfer_pair_id: string | null;
  note: string | null;
  merchant: string | null;
  /** App-private relative path under documents (e.g. receipts/<id>.jpg). */
  receipt_path: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  source: TransactionSource;
  source_ref: string | null;
  deleted_at: string | null;
  auto_categorized: number;
};

export type CreateTransactionInput = {
  accountId: string;
  categoryId?: string | null;
  amountMinor: number;
  currency: string;
  fxRateToBase: number;
  baseAmountMinor: number;
  type: TransactionType;
  note?: string | null;
  merchant?: string | null;
  receiptPath?: string | null;
  occurredAt?: string;
  source?: TransactionSource;
  sourceRef?: string | null;
  autoCategorized?: boolean;
};

export type UpdateTransactionInput = {
  accountId?: string;
  categoryId?: string | null;
  amountMinor?: number;
  currency?: string;
  fxRateToBase?: number;
  baseAmountMinor?: number;
  type?: TransactionType;
  note?: string | null;
  merchant?: string | null;
  /** Pass null to clear; omit to leave unchanged. */
  receiptPath?: string | null;
  occurredAt?: string;
};

export type TransactionMutationErrorCode =
  | 'invalid_fx_rate'
  | 'invalid_transfer_pair'
  | 'transfer_account_change_not_supported'
  | 'transfer_type_change_not_supported';

export class TransactionMutationError extends Error {
  constructor(readonly code: TransactionMutationErrorCode, message: string) {
    super(message);
    this.name = 'TransactionMutationError';
  }
}

export type TransactionListFilter = {
  search?: string;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  tagId?: string;
  source?: TransactionSource;
  /** Exclude a source (e.g. show non-recurring expenses). */
  excludeSource?: TransactionSource;
  /** Absolute amount floor in minor units (ABS(amount_minor)). */
  minAmountMinor?: number;
  /** Absolute amount ceiling in minor units (ABS(amount_minor)). */
  maxAmountMinor?: number;
  fromIso?: string;
  toIso?: string;
  limit?: number;
};

function mapTx(row: Record<string, string | number | boolean | null>): TransactionRow {
  const type = String(row.type);
  const source = String(row.source);
  return {
    id: String(row.id),
    account_id: String(row.account_id),
    category_id: row.category_id == null ? null : String(row.category_id),
    amount_minor: Number(row.amount_minor),
    currency: String(row.currency),
    fx_rate_to_base: Number(row.fx_rate_to_base),
    base_amount_minor: Number(row.base_amount_minor),
    type: type === 'income' || type === 'transfer' || type === 'expense' ? type : 'expense',
    transfer_pair_id: row.transfer_pair_id == null ? null : String(row.transfer_pair_id),
    note: row.note == null ? null : String(row.note),
    merchant: row.merchant == null ? null : String(row.merchant),
    receipt_path: row.receipt_path == null ? null : String(row.receipt_path),
    occurred_at: String(row.occurred_at),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    source:
      source === 'sms' || source === 'recurring' || source === 'import' || source === 'manual'
        ? source
        : 'manual',
    source_ref: row.source_ref == null ? null : String(row.source_ref),
    deleted_at: row.deleted_at == null ? null : String(row.deleted_at),
    auto_categorized: Number(row.auto_categorized),
  };
}

function assertValidFxRate(rate: number): void {
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new TransactionMutationError(
      'invalid_fx_rate',
      'The transaction FX rate must be a positive number.',
    );
  }
}

function transferDirection(amountMinor: number): -1 | 1 {
  if (amountMinor === 0) {
    throw new TransactionMutationError(
      'invalid_transfer_pair',
      'This transfer pair is invalid and cannot be edited safely.',
    );
  }
  return amountMinor < 0 ? -1 : 1;
}

export class TransactionsRepository extends Repository {
  constructor(db: SqlDatabase) {
    super(db);
  }

  async listRecent(limit = 50): Promise<TransactionRow[]> {
    return this.list({limit});
  }

  async list(filter: TransactionListFilter = {}): Promise<TransactionRow[]> {
    const clauses = ['deleted_at IS NULL'];
    const params: Array<string | number> = [];

    if (filter.type) {
      clauses.push('type = ?');
      params.push(filter.type);
    }
    if (filter.accountId) {
      clauses.push('account_id = ?');
      params.push(filter.accountId);
    }
    if (filter.categoryId) {
      clauses.push('category_id = ?');
      params.push(filter.categoryId);
    }
    if (filter.tagId) {
      clauses.push('id IN (SELECT transaction_id FROM transaction_tags WHERE tag_id = ?)');
      params.push(filter.tagId);
    }
    if (filter.source) {
      clauses.push('source = ?');
      params.push(filter.source);
    }
    if (filter.excludeSource) {
      clauses.push('source != ?');
      params.push(filter.excludeSource);
    }
    if (filter.minAmountMinor != null) {
      clauses.push('ABS(amount_minor) >= ?');
      params.push(filter.minAmountMinor);
    }
    if (filter.maxAmountMinor != null) {
      clauses.push('ABS(amount_minor) <= ?');
      params.push(filter.maxAmountMinor);
    }
    if (filter.fromIso) {
      clauses.push('occurred_at >= ?');
      params.push(filter.fromIso);
    }
    if (filter.toIso) {
      clauses.push('occurred_at <= ?');
      params.push(filter.toIso);
    }
    if (filter.search?.trim()) {
      clauses.push('(note LIKE ? OR merchant LIKE ?)');
      const q = `%${filter.search.trim()}%`;
      params.push(q, q);
    }

    const limit = filter.limit ?? 200;
    params.push(limit);

    const result = await this.query(
      `SELECT * FROM transactions
       WHERE ${clauses.join(' AND ')}
       ORDER BY occurred_at DESC
       LIMIT ?`,
      params,
    );
    return result.rows.map(mapTx);
  }

  async sumExpenseBaseInPeriod(fromIso: string, toIso: string): Promise<number> {
    const result = await this.query(
      `SELECT COALESCE(SUM(ABS(base_amount_minor)), 0) AS total
       FROM transactions
       WHERE deleted_at IS NULL
         AND type = 'expense'
         AND occurred_at >= ?
         AND occurred_at <= ?`,
      [fromIso, toIso],
    );
    return Number(result.rows[0]?.total ?? 0);
  }

  async listOccurredDates(limit = 400): Promise<string[]> {
    const result = await this.query(
      `SELECT occurred_at FROM transactions
       WHERE deleted_at IS NULL
       ORDER BY occurred_at DESC
       LIMIT ?`,
      [limit],
    );
    return result.rows.map(row => String(row.occurred_at));
  }

  async create(input: CreateTransactionInput): Promise<TransactionRow> {
    assertValidFxRate(input.fxRateToBase);
    const id = createId();
    const stamped = nowIso();
    const occurredAt = input.occurredAt ?? stamped;
    await this.run(
      'transactions',
      `INSERT INTO transactions (
        id, account_id, category_id, amount_minor, currency, fx_rate_to_base, base_amount_minor,
        type, transfer_pair_id, note, merchant, receipt_path, occurred_at, created_at, updated_at,
        source, source_ref, deleted_at, auto_categorized
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
      [
        id,
        input.accountId,
        input.categoryId ?? null,
        input.amountMinor,
        input.currency,
        input.fxRateToBase,
        input.baseAmountMinor,
        input.type,
        input.note ?? null,
        input.merchant ?? null,
        input.receiptPath ?? null,
        occurredAt,
        stamped,
        stamped,
        input.source ?? 'manual',
        input.sourceRef ?? null,
        input.autoCategorized ? 1 : 0,
      ],
      [id],
    );
    const created = await this.getById(id);
    if (!created) {
      throw new Error('Failed to create transaction');
    }
    return created;
  }

  /**
   * Inserts many transactions in one SQLite transaction.
   * On any failure the whole batch is rolled back.
   */
  async createMany(inputs: readonly CreateTransactionInput[]): Promise<TransactionRow[]> {
    if (inputs.length === 0) {
      return [];
    }
    const created: TransactionRow[] = [];
    await this.withTransaction(async tx => {
      const repo = new TransactionsRepository(tx);
      for (const input of inputs) {
        created.push(await repo.create(input));
      }
    });
    return created;
  }

  /**
   * Creates a linked transfer pair in one DB transaction.
   * Outgoing leg on `fromAccountId`, incoming on `toAccountId`.
   */
  async createTransfer(input: {
    fromAccountId: string;
    toAccountId: string;
    amountMinor: number;
    currency: string;
    fxRateToBase: number;
    baseAmountMinor: number;
    note?: string | null;
    occurredAt?: string;
  }): Promise<{out: TransactionRow; inn: TransactionRow}> {
    const outId = createId();
    const inId = createId();
    const stamped = nowIso();
    const occurredAt = input.occurredAt ?? stamped;
    assertValidFxRate(input.fxRateToBase);
    const fx = input.fxRateToBase;

    const absAmount = Math.abs(input.amountMinor);
    const absBase = Math.abs(input.baseAmountMinor);

    await this.withTransaction(async tx => {
      // Signed minor units: out negative, in positive — balance SQL uses amount as-is.
      await tx.execute(
        `INSERT INTO transactions (
          id, account_id, category_id, amount_minor, currency, fx_rate_to_base, base_amount_minor,
          type, transfer_pair_id, note, merchant, occurred_at, created_at, updated_at,
          source, source_ref, deleted_at, auto_categorized
        ) VALUES (?, ?, NULL, ?, ?, ?, ?, 'transfer', ?, ?, NULL, ?, ?, ?, 'manual', NULL, NULL, 0)`,
        [
          outId,
          input.fromAccountId,
          -absAmount,
          input.currency,
          fx,
          -absBase,
          inId,
          input.note ?? null,
          occurredAt,
          stamped,
          stamped,
        ],
      );
      await tx.execute(
        `INSERT INTO transactions (
          id, account_id, category_id, amount_minor, currency, fx_rate_to_base, base_amount_minor,
          type, transfer_pair_id, note, merchant, occurred_at, created_at, updated_at,
          source, source_ref, deleted_at, auto_categorized
        ) VALUES (?, ?, NULL, ?, ?, ?, ?, 'transfer', ?, ?, NULL, ?, ?, ?, 'manual', NULL, NULL, 0)`,
        [
          inId,
          input.toAccountId,
          absAmount,
          input.currency,
          fx,
          absBase,
          outId,
          input.note ?? null,
          occurredAt,
          stamped,
          stamped,
        ],
      );
    });

    emitDbChange({table: 'transactions', ids: [outId, inId]});

    const out = await this.getById(outId);
    const inn = await this.getById(inId);
    if (!out || !inn) {
      throw new Error('Failed to create transfer pair');
    }
    return {out, inn};
  }

  async update(id: string, input: UpdateTransactionInput): Promise<TransactionRow> {
    const existing = await this.getById(id);
    if (!existing || existing.deleted_at) {
      throw new Error('Transaction not found');
    }

    const requestedType = input.type ?? existing.type;
    if (
      requestedType !== existing.type &&
      (requestedType === 'transfer' || existing.type === 'transfer')
    ) {
      throw new TransactionMutationError(
        'transfer_type_change_not_supported',
        'Changing a saved transaction to or from a transfer is not supported.',
      );
    }
    if (input.fxRateToBase !== undefined) {
      assertValidFxRate(input.fxRateToBase);
    }

    if (existing.type === 'transfer') {
      return this.updateTransferLeg(existing, input);
    }

    const stamped = nowIso();
    await this.run(
      'transactions',
      `UPDATE transactions SET
        account_id = ?,
        category_id = ?,
        amount_minor = ?,
        currency = ?,
        fx_rate_to_base = ?,
        base_amount_minor = ?,
        type = ?,
        note = ?,
        merchant = ?,
        receipt_path = ?,
        occurred_at = ?,
        updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [
        input.accountId ?? existing.account_id,
        input.categoryId !== undefined ? input.categoryId : existing.category_id,
        input.amountMinor ?? existing.amount_minor,
        input.currency ?? existing.currency,
        input.fxRateToBase ?? existing.fx_rate_to_base,
        input.baseAmountMinor ?? existing.base_amount_minor,
        input.type ?? existing.type,
        input.note !== undefined ? input.note : existing.note,
        input.merchant !== undefined ? input.merchant : existing.merchant,
        input.receiptPath !== undefined ? input.receiptPath : existing.receipt_path,
        input.occurredAt ?? existing.occurred_at,
        stamped,
        id,
      ],
      [id],
    );

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Failed to update transaction');
    }
    return updated;
  }

  private async updateTransferLeg(
    existing: TransactionRow,
    input: UpdateTransactionInput,
  ): Promise<TransactionRow> {
    if (input.accountId !== undefined && input.accountId !== existing.account_id) {
      throw new TransactionMutationError(
        'transfer_account_change_not_supported',
        'Changing accounts on an existing transfer is not supported.',
      );
    }

    const pairId = existing.transfer_pair_id;
    if (!pairId) {
      throw new TransactionMutationError(
        'invalid_transfer_pair',
        'This transfer pair is invalid and cannot be edited safely.',
      );
    }
    const pair = await this.getById(pairId);
    if (
      !pair ||
      pair.deleted_at ||
      pair.type !== 'transfer' ||
      pair.transfer_pair_id !== existing.id ||
      pair.account_id === existing.account_id
    ) {
      throw new TransactionMutationError(
        'invalid_transfer_pair',
        'This transfer pair is invalid and cannot be edited safely.',
      );
    }

    const direction = transferDirection(existing.amount_minor);
    if (transferDirection(pair.amount_minor) === direction) {
      throw new TransactionMutationError(
        'invalid_transfer_pair',
        'This transfer pair is invalid and cannot be edited safely.',
      );
    }

    const amountMagnitude = Math.abs(input.amountMinor ?? existing.amount_minor);
    const baseMagnitude = Math.abs(input.baseAmountMinor ?? existing.base_amount_minor);
    if (amountMagnitude === 0 || baseMagnitude === 0) {
      throw new TransactionMutationError(
        'invalid_transfer_pair',
        'A transfer amount must be greater than zero.',
      );
    }

    const amountMinor = direction * amountMagnitude;
    const baseAmountMinor = direction * baseMagnitude;
    const pairAmountMinor = -amountMinor;
    const pairBaseAmountMinor = -baseAmountMinor;
    const currency = input.currency ?? existing.currency;
    const fxRateToBase = input.fxRateToBase ?? existing.fx_rate_to_base;
    const note = input.note !== undefined ? input.note : existing.note;
    const occurredAt = input.occurredAt ?? existing.occurred_at;
    const stamped = nowIso();

    await this.withTransaction(async tx => {
      await tx.execute(
        `UPDATE transactions SET
          category_id = NULL,
          amount_minor = ?,
          currency = ?,
          fx_rate_to_base = ?,
          base_amount_minor = ?,
          note = ?,
          occurred_at = ?,
          updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`,
        [
          amountMinor,
          currency,
          fxRateToBase,
          baseAmountMinor,
          note,
          occurredAt,
          stamped,
          existing.id,
        ],
      );
      await tx.execute(
        `UPDATE transactions SET
          category_id = NULL,
          amount_minor = ?,
          currency = ?,
          fx_rate_to_base = ?,
          base_amount_minor = ?,
          note = ?,
          occurred_at = ?,
          updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`,
        [
          pairAmountMinor,
          currency,
          fxRateToBase,
          pairBaseAmountMinor,
          note,
          occurredAt,
          stamped,
          pair.id,
        ],
      );
    });
    emitDbChange({table: 'transactions', ids: [existing.id, pair.id]});

    const updated = await this.getById(existing.id);
    if (!updated) {
      throw new Error('Failed to update transaction');
    }
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await this.softDeleteMany([id]);
  }

  async softDeleteMany(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const stamped = nowIso();
    const unique = [...new Set(ids)];
    const selectPlaceholders = unique.map(() => '?').join(',');
    const existing = await this.query(
      `SELECT id, transfer_pair_id FROM transactions WHERE id IN (${selectPlaceholders})`,
      unique,
    );
    const allIds = new Set(unique);
    for (const row of existing.rows) {
      if (row.transfer_pair_id != null) {
        allIds.add(String(row.transfer_pair_id));
      }
    }
    const list = [...allIds];
    const placeholders = list.map(() => '?').join(',');
    await this.run(
      'transactions',
      `UPDATE transactions SET deleted_at = ?, updated_at = ?
       WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      [stamped, stamped, ...list],
      list,
    );
  }

  async setCategoryMany(ids: readonly string[], categoryId: string | null): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const stamped = nowIso();
    const placeholders = ids.map(() => '?').join(',');
    await this.run(
      'transactions',
      `UPDATE transactions SET category_id = ?, updated_at = ?, auto_categorized = 0
       WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      [categoryId, stamped, ...ids],
      ids,
    );
  }

  /** Soft-deleted transactions still inside the 30-day trash window. */
  async listDeleted(limit = 200): Promise<TransactionRow[]> {
    const result = await this.query(
      `SELECT * FROM transactions
       WHERE deleted_at IS NOT NULL
         AND deleted_at >= datetime('now', '-30 days')
       ORDER BY deleted_at DESC
       LIMIT ?`,
      [limit],
    );
    return result.rows.map(mapTx);
  }

  async restore(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing?.deleted_at) {
      throw new Error('Transaction not found in trash');
    }
    const stamped = nowIso();
    await this.run(
      'transactions',
      `UPDATE transactions SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL`,
      [stamped, id],
      [id],
    );
    if (existing.transfer_pair_id) {
      await this.run(
        'transactions',
        `UPDATE transactions SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL`,
        [stamped, existing.transfer_pair_id],
        [existing.transfer_pair_id],
      );
    }
  }

  /**
   * Permanently deletes a transaction (and transfer pair).
   * Returns receipt paths that should be deleted from app-private storage.
   */
  async hardDelete(id: string): Promise<{receiptPaths: string[]}> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Transaction not found');
    }
    const receiptPaths: string[] = [];
    if (existing.receipt_path) {
      receiptPaths.push(existing.receipt_path);
    }
    if (existing.transfer_pair_id) {
      const pair = await this.getById(existing.transfer_pair_id);
      if (pair?.receipt_path) {
        receiptPaths.push(pair.receipt_path);
      }
    }
    const ids = [id];
    if (existing.transfer_pair_id) {
      ids.push(existing.transfer_pair_id);
    }
    await this.run(
      'transactions',
      `DELETE FROM transactions WHERE id = ? OR id = ?`,
      [id, existing.transfer_pair_id ?? id],
      ids,
    );
    return {receiptPaths};
  }

  async getById(id: string): Promise<TransactionRow | null> {
    const result = await this.query(`SELECT * FROM transactions WHERE id = ?`, [id]);
    const row = result.rows[0];
    return row ? mapTx(row) : null;
  }

  /**
   * Looks up any transaction (including soft-deleted) by source_ref.
   * Used for idempotent recurring occurrence generation.
   */
  async findBySourceRef(sourceRef: string): Promise<TransactionRow | null> {
    const result = await this.query(
      `SELECT * FROM transactions WHERE source_ref = ? LIMIT 1`,
      [sourceRef],
    );
    const row = result.rows[0];
    return row ? mapTx(row) : null;
  }

  /**
   * Finds an active transaction that matches import duplicate criteria.
   */
  async findActiveImportMatch(input: {
    accountId: string;
    amountMinor: number;
    currency: string;
    type: TransactionType;
    occurredAt: string;
    merchant: string | null;
  }): Promise<TransactionRow | null> {
    const result = await this.query(
      `SELECT * FROM transactions
       WHERE deleted_at IS NULL
         AND account_id = ?
         AND amount_minor = ?
         AND currency = ?
         AND type = ?
         AND occurred_at = ?
         AND IFNULL(merchant, '') = IFNULL(?, '')
       LIMIT 1`,
      [
        input.accountId,
        input.amountMinor,
        input.currency,
        input.type,
        input.occurredAt,
        input.merchant,
      ],
    );
    const row = result.rows[0];
    return row ? mapTx(row) : null;
  }

  async explainRecentList(): Promise<string[]> {
    const result = await this.query(
      `EXPLAIN QUERY PLAN
       SELECT * FROM transactions
       WHERE deleted_at IS NULL
       ORDER BY occurred_at DESC
       LIMIT 50`,
    );
    return result.rows.map(row => String(row.detail ?? JSON.stringify(row)));
  }

  async explainAccountPeriod(): Promise<string[]> {
    const result = await this.query(
      `EXPLAIN QUERY PLAN
       SELECT * FROM transactions
       WHERE account_id = ? AND deleted_at IS NULL
       ORDER BY occurred_at DESC`,
      ['00000000-0000-4000-8000-000000000000'],
    );
    return result.rows.map(row => String(row.detail ?? JSON.stringify(row)));
  }
}
