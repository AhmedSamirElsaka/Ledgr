import {transactionsToCsv, type CsvTransactionRow} from '../../domain/backup/csv';
import {
  BackupSchema,
  prepareBackup,
  validateBackupJson,
  type BackupPayload,
  type PreparedBackup,
} from '../../domain/backup/schema';
import {emitDbChange} from '../events';
import {
  collectReceiptFiles,
  removeOrphanReceiptFiles,
  restoreReceiptFiles,
} from '../receipts/receiptStorage';

import type {SqlDatabase} from '../types';

async function selectAll(
  db: SqlDatabase,
  table: string,
): Promise<Array<Record<string, string | number | null>>> {
  const result = await db.execute(`SELECT * FROM ${table}`);
  return result.rows.map(row => {
    const out: Record<string, string | number | null> = {};
    for (const [k, v] of Object.entries(row)) {
      if (typeof v === 'boolean') {
        out[k] = v ? 1 : 0;
      } else {
        out[k] = v;
      }
    }
    return out;
  });
}

export async function buildBackupPayload(db: SqlDatabase): Promise<BackupPayload> {
  const [
    settings,
    accounts,
    categories,
    transactions,
    budgets,
    subscriptions,
    sms_rules,
    sms_messages,
    recurring_rules,
    fx_rates,
    merchant_aliases,
    tags,
    transaction_tags,
  ] = await Promise.all([
    selectAll(db, 'settings'),
    selectAll(db, 'accounts'),
    selectAll(db, 'categories'),
    selectAll(db, 'transactions'),
    selectAll(db, 'budgets'),
    selectAll(db, 'subscriptions'),
    selectAll(db, 'sms_rules'),
    selectAll(db, 'sms_messages'),
    selectAll(db, 'recurring_rules'),
    selectAll(db, 'fx_rates'),
    selectAll(db, 'merchant_aliases'),
    selectAll(db, 'tags'),
    selectAll(db, 'transaction_tags'),
  ]);

  const normalizedTransactions = transactions.map(row => ({
    ...row,
    receipt_path: row.receipt_path == null ? null : String(row.receipt_path),
  }));

  const receipt_files = await collectReceiptFiles(
    normalizedTransactions.map(row =>
      typeof row.receipt_path === 'string' ? row.receipt_path : null,
    ),
  );

  const parsed = BackupSchema.parse({
    version: 2,
    exportedAt: new Date().toISOString(),
    settings,
    accounts,
    categories,
    transactions: normalizedTransactions,
    budgets,
    subscriptions,
    sms_rules,
    sms_messages,
    recurring_rules,
    fx_rates,
    merchant_aliases,
    tags,
    transaction_tags,
    receipt_files,
  });
  const prepared = prepareBackup(parsed);
  if (!prepared.ok) {
    throw new Error(prepared.error);
  }
  return prepared.prepared.data;
}

export async function exportTransactionsCsv(db: SqlDatabase): Promise<string> {
  const result = await db.execute(
    `SELECT id, occurred_at, type, amount_minor, currency, base_amount_minor,
            account_id, category_id, merchant, note, source
     FROM transactions
     WHERE deleted_at IS NULL
     ORDER BY occurred_at DESC`,
  );
  const rows: CsvTransactionRow[] = result.rows.map(row => ({
    id: String(row.id),
    occurredAt: String(row.occurred_at),
    type: String(row.type),
    amountMinor: Number(row.amount_minor),
    currency: String(row.currency),
    baseAmountMinor: Number(row.base_amount_minor),
    accountId: String(row.account_id),
    categoryId: row.category_id == null ? '' : String(row.category_id),
    merchant: row.merchant == null ? '' : String(row.merchant),
    note: row.note == null ? '' : String(row.note),
    source: String(row.source),
  }));
  return transactionsToCsv(rows);
}

export function previewBackup(
  raw: unknown,
): {ok: true; prepared: PreparedBackup} | {ok: false; error: string} {
  return prepareBackup(raw);
}

export async function restoreBackup(
  db: SqlDatabase,
  raw: unknown,
): Promise<{ok: true} | {ok: false; error: string}> {
  const validated = validateBackupJson(raw);
  if (!validated.ok) {
    return validated;
  }
  await replaceBackupData(db, validated.data);
  return {ok: true};
}

export async function restorePreparedBackup(
  db: SqlDatabase,
  prepared: PreparedBackup,
): Promise<void> {
  await replaceBackupData(db, prepared.data);
}

async function replaceBackupData(db: SqlDatabase, data: BackupPayload): Promise<void> {
  await db.transaction(async tx => {
    await tx.execute('PRAGMA defer_foreign_keys = ON');
    const tables = [
      'transaction_tags',
      'tags',
      'sms_messages',
      'sms_rules',
      'recurring_rules',
      'subscriptions',
      'budgets',
      'transactions',
      'merchant_aliases',
      'fx_rates',
      'categories',
      'accounts',
      'settings',
    ];
    for (const table of tables) {
      await tx.execute(`DELETE FROM ${table}`);
    }

    await insertRows(
      tx,
      'settings',
      ['key', 'value', 'updated_at'],
      data.settings.map(row => [row.key, row.value, row.updated_at]),
    );
    await insertRows(
      tx,
      'accounts',
      [
        'id',
        'name',
        'type',
        'currency',
        'opening_balance_minor',
        'color',
        'icon',
        'archived',
        'created_at',
        'updated_at',
      ],
      data.accounts.map(row => [
        row.id,
        row.name,
        row.type,
        row.currency,
        row.opening_balance_minor,
        row.color,
        row.icon,
        row.archived,
        row.created_at,
        row.updated_at,
      ]),
    );
    await insertRows(
      tx,
      'categories',
      [
        'id',
        'name',
        'icon',
        'color',
        'kind',
        'parent_id',
        'sort_order',
        'archived',
        'created_at',
        'updated_at',
      ],
      data.categories.map(row => [
        row.id,
        row.name,
        row.icon,
        row.color,
        row.kind,
        row.parent_id,
        row.sort_order,
        row.archived,
        row.created_at,
        row.updated_at,
      ]),
    );
    await insertRows(
      tx,
      'fx_rates',
      ['id', 'base_currency', 'quote_currency', 'rate', 'updated_at'],
      data.fx_rates.map(row => [
        row.id,
        row.base_currency,
        row.quote_currency,
        row.rate,
        row.updated_at,
      ]),
    );
    await insertRows(
      tx,
      'merchant_aliases',
      ['id', 'raw_merchant', 'display_merchant', 'category_id', 'hit_count', 'updated_at'],
      data.merchant_aliases.map(row => [
        row.id,
        row.raw_merchant,
        row.display_merchant,
        row.category_id,
        row.hit_count,
        row.updated_at,
      ]),
    );
    await insertRows(
      tx,
      'transactions',
      [
        'id',
        'account_id',
        'category_id',
        'amount_minor',
        'currency',
        'fx_rate_to_base',
        'base_amount_minor',
        'type',
        'transfer_pair_id',
        'note',
        'merchant',
        'receipt_path',
        'occurred_at',
        'created_at',
        'updated_at',
        'source',
        'source_ref',
        'deleted_at',
        'auto_categorized',
      ],
      data.transactions.map(row => [
        row.id,
        row.account_id,
        row.category_id,
        row.amount_minor,
        row.currency,
        row.fx_rate_to_base,
        row.base_amount_minor,
        row.type,
        row.transfer_pair_id,
        row.note,
        row.merchant,
        row.receipt_path,
        row.occurred_at,
        row.created_at,
        row.updated_at,
        row.source,
        row.source_ref,
        row.deleted_at,
        row.auto_categorized,
      ]),
    );
    await insertRows(
      tx,
      'budgets',
      [
        'id',
        'category_id',
        'period',
        'amount_minor',
        'currency',
        'rollover',
        'start_date',
        'end_date',
        'active',
        'created_at',
        'updated_at',
      ],
      data.budgets.map(row => [
        row.id,
        row.category_id,
        row.period,
        row.amount_minor,
        row.currency,
        row.rollover,
        row.start_date,
        row.end_date,
        row.active,
        row.created_at,
        row.updated_at,
      ]),
    );
    await insertRows(
      tx,
      'subscriptions',
      [
        'id',
        'name',
        'merchant_matcher',
        'amount_minor',
        'currency',
        'cycle',
        'custom_days',
        'next_due_date',
        'account_id',
        'category_id',
        'reminder_days_before',
        'status',
        'icon',
        'color',
        'created_at',
        'updated_at',
      ],
      data.subscriptions.map(row => [
        row.id,
        row.name,
        row.merchant_matcher,
        row.amount_minor,
        row.currency,
        row.cycle,
        row.custom_days,
        row.next_due_date,
        row.account_id,
        row.category_id,
        row.reminder_days_before,
        row.status,
        row.icon,
        row.color,
        row.created_at,
        row.updated_at,
      ]),
    );
    await insertRows(
      tx,
      'recurring_rules',
      [
        'id',
        'name',
        'account_id',
        'category_id',
        'amount_minor',
        'currency',
        'type',
        'cycle',
        'custom_days',
        'next_occurred_at',
        'note',
        'active',
        'created_at',
        'updated_at',
      ],
      data.recurring_rules.map(row => [
        row.id,
        row.name,
        row.account_id,
        row.category_id,
        row.amount_minor,
        row.currency,
        row.type,
        row.cycle,
        row.custom_days,
        row.next_occurred_at,
        row.note,
        row.active,
        row.created_at,
        row.updated_at,
      ]),
    );
    await insertRows(
      tx,
      'sms_rules',
      [
        'id',
        'name',
        'sender_pattern',
        'body_regex',
        'capture_map_json',
        'default_account_id',
        'default_category_id',
        'priority',
        'enabled',
        'created_at',
        'updated_at',
      ],
      data.sms_rules.map(row => [
        row.id,
        row.name,
        row.sender_pattern,
        row.body_regex,
        row.capture_map_json,
        row.default_account_id,
        row.default_category_id,
        row.priority,
        row.enabled,
        row.created_at,
        row.updated_at,
      ]),
    );
    await insertRows(
      tx,
      'sms_messages',
      [
        'id',
        'sender',
        'body',
        'received_at',
        'status',
        'matched_rule_id',
        'created_transaction_id',
        'dedupe_hash',
        'fingerprint',
        'device_sms_id',
        'parse_method',
        'parse_confidence',
        'parse_reason',
        'extracted_reference',
        'created_at',
      ],
      data.sms_messages.map(row => [
        row.id,
        row.sender,
        row.body,
        row.received_at,
        row.status,
        row.matched_rule_id,
        row.created_transaction_id,
        row.dedupe_hash,
        row.fingerprint ?? null,
        row.device_sms_id ?? null,
        row.parse_method ?? null,
        row.parse_confidence ?? null,
        row.parse_reason ?? null,
        row.extracted_reference ?? null,
        row.created_at,
      ]),
    );
    await insertRows(
      tx,
      'tags',
      ['id', 'name', 'color', 'created_at'],
      data.tags.map(row => [row.id, row.name, row.color, row.created_at]),
    );
    await insertRows(
      tx,
      'transaction_tags',
      ['transaction_id', 'tag_id'],
      data.transaction_tags.map(row => [row.transaction_id, row.tag_id]),
    );
  });

  await restoreReceiptFiles(data.receipt_files);
  const referenced = new Set(
    data.transactions
      .map(row => row.receipt_path)
      .filter((path): path is string => path != null && path.length > 0),
  );
  await removeOrphanReceiptFiles(referenced);

  emitDbChange({table: 'transactions'});
  emitDbChange({table: 'accounts'});
  emitDbChange({table: 'settings'});
  emitDbChange({table: 'recurring_rules'});
}

async function insertRows(
  db: SqlDatabase,
  table: string,
  columns: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<string | number | boolean | null>>,
): Promise<void> {
  const placeholders = columns.map(() => '?').join(',');
  const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;
  for (const row of rows) {
    await db.execute(sql, row);
  }
}

export function buildHtmlReport(input: {
  title: string;
  baseCurrency: string;
  periodLabel: string;
  expenseMinor: number;
  incomeMinor: number;
  topCategories: Array<{name: string; totalMinor: number}>;
}): string {
  const rows = input.topCategories
    .map(
      c =>
        `<tr><td>${escapeHtml(c.name)}</td><td>${(c.totalMinor / 100).toFixed(2)} ${escapeHtml(
          input.baseCurrency,
        )}</td></tr>`,
    )
    .join('');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${escapeHtml(input.title)}</title>
<style>
body{font-family:system-ui,sans-serif;padding:24px;color:#0F1C1F;background:#F4F7F8}
h1{color:#0F8F8A} table{border-collapse:collapse;width:100%;background:#fff}
td,th{border:1px solid #E2E9EC;padding:8px;text-align:left}
</style></head><body>
<h1>${escapeHtml(input.title)}</h1>
<p>Period: ${escapeHtml(input.periodLabel)}</p>
<p>Income: ${(input.incomeMinor / 100).toFixed(2)} ${escapeHtml(input.baseCurrency)}</p>
<p>Expense: ${(input.expenseMinor / 100).toFixed(2)} ${escapeHtml(input.baseCurrency)}</p>
<h2>Top categories</h2>
<table><thead><tr><th>Category</th><th>Spend</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
