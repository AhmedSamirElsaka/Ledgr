import {z} from 'zod';

const id = z.string().min(1);
const timestamp = z.string().min(1);
const nullableId = id.nullable();
const nullableText = z.string().nullable();
const sqliteBoolean = z.number().int().min(0).max(1);

export const SettingsBackupRowSchema = z
  .object({
    key: z.string().min(1),
    value: z.string(),
    updated_at: timestamp,
  })
  .strict();

export const AccountBackupRowSchema = z
  .object({
    id,
    name: z.string(),
    type: z.enum(['cash', 'bank', 'card', 'wallet']),
    currency: z.string(),
    opening_balance_minor: z.number().int(),
    color: z.string(),
    icon: z.string(),
    archived: sqliteBoolean,
    created_at: timestamp,
    updated_at: timestamp,
  })
  .strict();

export const CategoryBackupRowSchema = z
  .object({
    id,
    name: z.string(),
    icon: z.string(),
    color: z.string(),
    kind: z.enum(['expense', 'income']),
    parent_id: nullableId,
    sort_order: z.number().int(),
    archived: sqliteBoolean,
    created_at: timestamp,
    updated_at: timestamp,
  })
  .strict();

export const TransactionBackupRowSchema = z
  .object({
    id,
    account_id: id,
    category_id: nullableId,
    amount_minor: z.number().int(),
    currency: z.string(),
    fx_rate_to_base: z.number(),
    base_amount_minor: z.number().int(),
    type: z.enum(['expense', 'income', 'transfer']),
    transfer_pair_id: nullableId,
    note: nullableText,
    merchant: nullableText,
    /** Relative app-private path; optional for older backups. */
    receipt_path: nullableText.optional(),
    occurred_at: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
    source: z.enum(['manual', 'sms', 'recurring', 'import']),
    source_ref: nullableText,
    deleted_at: nullableText,
    auto_categorized: sqliteBoolean,
  })
  .strict();

export const TagBackupRowSchema = z
  .object({
    id,
    name: z.string(),
    color: z.string(),
    created_at: timestamp,
  })
  .strict();

export const TransactionTagBackupRowSchema = z
  .object({
    transaction_id: id,
    tag_id: id,
  })
  .strict();

export const BudgetBackupRowSchema = z
  .object({
    id,
    category_id: nullableId,
    period: z.enum(['weekly', 'monthly', 'custom']),
    amount_minor: z.number().int(),
    currency: z.string(),
    rollover: sqliteBoolean,
    start_date: timestamp,
    end_date: nullableText,
    active: sqliteBoolean,
    created_at: timestamp,
    updated_at: timestamp,
  })
  .strict();

export const SubscriptionBackupRowSchema = z
  .object({
    id,
    name: z.string(),
    merchant_matcher: nullableText,
    amount_minor: z.number().int(),
    currency: z.string(),
    cycle: z.enum(['monthly', 'yearly', 'custom']),
    custom_days: z.number().int().nullable(),
    next_due_date: timestamp,
    account_id: nullableId,
    category_id: nullableId,
    reminder_days_before: z.number().int(),
    status: z.enum(['active', 'cancelled', 'paused']),
    icon: nullableText,
    color: nullableText,
    created_at: timestamp,
    updated_at: timestamp,
  })
  .strict();

export const SmsRuleBackupRowSchema = z
  .object({
    id,
    name: z.string(),
    sender_pattern: z.string(),
    body_regex: z.string(),
    capture_map_json: z.string(),
    default_account_id: nullableId,
    default_category_id: nullableId,
    priority: z.number().int(),
    enabled: sqliteBoolean,
    created_at: timestamp,
    updated_at: timestamp,
  })
  .strict();

export const SmsMessageBackupRowSchema = z
  .object({
    id,
    sender: z.string(),
    body: z.string(),
    received_at: timestamp,
    status: z.enum(['parsed', 'ignored', 'needs_review', 'duplicate']),
    matched_rule_id: nullableId,
    created_transaction_id: nullableId,
    dedupe_hash: nullableText,
    fingerprint: nullableText.optional(),
    device_sms_id: nullableText.optional(),
    parse_method: nullableText.optional(),
    parse_confidence: z.number().int().nullable().optional(),
    parse_reason: nullableText.optional(),
    extracted_reference: nullableText.optional(),
    created_at: timestamp,
  })
  .strict();

export const RecurringRuleBackupRowSchema = z
  .object({
    id,
    name: z.string(),
    account_id: id,
    category_id: nullableId,
    amount_minor: z.number().int(),
    currency: z.string(),
    type: z.enum(['expense', 'income']),
    cycle: z.enum(['weekly', 'monthly', 'yearly', 'custom']),
    custom_days: z.number().int().nullable(),
    next_occurred_at: timestamp,
    note: nullableText,
    active: sqliteBoolean,
    created_at: timestamp,
    updated_at: timestamp,
  })
  .strict();

export const FxRateBackupRowSchema = z
  .object({
    id,
    base_currency: z.string(),
    quote_currency: z.string(),
    rate: z.number(),
    updated_at: timestamp,
  })
  .strict();

export const MerchantAliasBackupRowSchema = z
  .object({
    id,
    raw_merchant: z.string(),
    display_merchant: z.string(),
    category_id: nullableId,
    hit_count: z.number().int(),
    updated_at: timestamp,
  })
  .strict();

const backupTables = {
  settings: z.array(SettingsBackupRowSchema),
  accounts: z.array(AccountBackupRowSchema),
  categories: z.array(CategoryBackupRowSchema),
  transactions: z.array(TransactionBackupRowSchema),
  budgets: z.array(BudgetBackupRowSchema),
  subscriptions: z.array(SubscriptionBackupRowSchema),
  sms_rules: z.array(SmsRuleBackupRowSchema),
  sms_messages: z.array(SmsMessageBackupRowSchema),
  recurring_rules: z.array(RecurringRuleBackupRowSchema),
  fx_rates: z.array(FxRateBackupRowSchema),
  merchant_aliases: z.array(MerchantAliasBackupRowSchema),
  tags: z.array(TagBackupRowSchema),
  transaction_tags: z.array(TransactionTagBackupRowSchema),
};

/** Relative receipt path → base64 file bytes (optional; restore writes under documents/). */
const receiptFilesSchema = z.record(z.string().min(1), z.string());

export const BackupSchema = z
  .object({
    version: z.literal(2),
    exportedAt: timestamp,
    ...backupTables,
    receipt_files: receiptFilesSchema.optional(),
  })
  .strict();

const BackupV1Schema = z
  .object({
    version: z.literal(1),
    exportedAt: timestamp,
    settings: backupTables.settings,
    accounts: backupTables.accounts,
    categories: backupTables.categories,
    transactions: backupTables.transactions,
    budgets: backupTables.budgets,
    subscriptions: backupTables.subscriptions,
    sms_rules: backupTables.sms_rules,
    sms_messages: backupTables.sms_messages,
    fx_rates: backupTables.fx_rates,
    merchant_aliases: backupTables.merchant_aliases,
    tags: backupTables.tags.optional(),
    transaction_tags: backupTables.transaction_tags.optional(),
    receipt_files: receiptFilesSchema.optional(),
  })
  .strict();

export type BackupTransactionRow = z.infer<typeof TransactionBackupRowSchema> & {
  receipt_path: string | null;
};

export type BackupPayload = Omit<z.infer<typeof BackupSchema>, 'transactions' | 'receipt_files'> & {
  transactions: BackupTransactionRow[];
  receipt_files: Record<string, string>;
};

export type BackupSummary = {
  sourceVersion: 1 | 2;
  exportedAt: string;
  totalRows: number;
  counts: {
    accounts: number;
    categories: number;
    transactions: number;
    budgets: number;
    subscriptions: number;
    recurringRules: number;
    smsRules: number;
    smsMessages: number;
    tags: number;
  };
};

export type PreparedBackup = {
  data: BackupPayload;
  summary: BackupSummary;
};

type ValidationResult = {ok: true; prepared: PreparedBackup} | {ok: false; error: string};

export function validateBackupJson(raw: unknown):
  | {
      ok: true;
      data: BackupPayload;
    }
  | {ok: false; error: string} {
  const prepared = prepareBackup(raw);
  if (!prepared.ok) {
    return prepared;
  }
  return {ok: true, data: prepared.prepared.data};
}

export function prepareBackup(raw: unknown): ValidationResult {
  const current = BackupSchema.safeParse(raw);
  if (current.success) {
    return preflight(normalizeBackupPayload(current.data), 2);
  }

  const legacy = BackupV1Schema.safeParse(raw);
  if (!legacy.success) {
    const issue = current.error.issues[0] ?? legacy.error.issues[0];
    return {
      ok: false,
      error: issue ? `${issue.path.join('.') || 'backup'}: ${issue.message}` : 'Invalid backup',
    };
  }

  return preflight(
    normalizeBackupPayload({
      exportedAt: legacy.data.exportedAt,
      settings: legacy.data.settings,
      accounts: legacy.data.accounts,
      categories: legacy.data.categories,
      transactions: legacy.data.transactions,
      budgets: legacy.data.budgets,
      subscriptions: legacy.data.subscriptions,
      sms_rules: legacy.data.sms_rules,
      sms_messages: legacy.data.sms_messages,
      recurring_rules: [],
      fx_rates: legacy.data.fx_rates,
      merchant_aliases: legacy.data.merchant_aliases,
      tags: legacy.data.tags ?? [],
      transaction_tags: legacy.data.transaction_tags ?? [],
      receipt_files: legacy.data.receipt_files ?? {},
    }),
    1,
  );
}

function normalizeBackupPayload(data: {
  exportedAt: string;
  settings: BackupPayload['settings'];
  accounts: BackupPayload['accounts'];
  categories: BackupPayload['categories'];
  transactions: Array<z.infer<typeof TransactionBackupRowSchema>>;
  budgets: BackupPayload['budgets'];
  subscriptions: BackupPayload['subscriptions'];
  sms_rules: BackupPayload['sms_rules'];
  sms_messages: BackupPayload['sms_messages'];
  recurring_rules: BackupPayload['recurring_rules'];
  fx_rates: BackupPayload['fx_rates'];
  merchant_aliases: BackupPayload['merchant_aliases'];
  tags?: BackupPayload['tags'];
  transaction_tags?: BackupPayload['transaction_tags'];
  receipt_files?: Record<string, string>;
}): BackupPayload {
  return {
    version: 2,
    exportedAt: data.exportedAt,
    settings: data.settings,
    accounts: data.accounts,
    categories: data.categories,
    transactions: data.transactions.map(row => ({
      ...row,
      receipt_path: row.receipt_path ?? null,
    })),
    budgets: data.budgets,
    subscriptions: data.subscriptions,
    sms_rules: data.sms_rules,
    sms_messages: data.sms_messages,
    recurring_rules: data.recurring_rules,
    fx_rates: data.fx_rates,
    merchant_aliases: data.merchant_aliases,
    tags: data.tags ?? [],
    transaction_tags: data.transaction_tags ?? [],
    receipt_files: data.receipt_files ?? {},
  };
}

function preflight(data: BackupPayload, sourceVersion: 1 | 2): ValidationResult {
  const issues = findIntegrityIssues(data);
  if (issues.length > 0) {
    return {ok: false, error: `Referential integrity: ${issues[0]}`};
  }

  const counts = {
    accounts: data.accounts.length,
    categories: data.categories.length,
    transactions: data.transactions.length,
    budgets: data.budgets.length,
    subscriptions: data.subscriptions.length,
    recurringRules: data.recurring_rules.length,
    smsRules: data.sms_rules.length,
    smsMessages: data.sms_messages.length,
    tags: data.tags.length,
  };

  return {
    ok: true,
    prepared: {
      data,
      summary: {
        sourceVersion,
        exportedAt: data.exportedAt,
        totalRows:
          data.settings.length +
          data.accounts.length +
          data.categories.length +
          data.transactions.length +
          data.budgets.length +
          data.subscriptions.length +
          data.sms_rules.length +
          data.sms_messages.length +
          data.recurring_rules.length +
          data.fx_rates.length +
          data.merchant_aliases.length +
          data.tags.length +
          data.transaction_tags.length,
        counts,
      },
    },
  };
}

function findIntegrityIssues(data: BackupPayload): string[] {
  const issues: string[] = [];
  const accountIds = new Set(data.accounts.map(row => row.id));
  const categoryIds = new Set(data.categories.map(row => row.id));
  const transactionIds = new Set(data.transactions.map(row => row.id));
  const tagIds = new Set(data.tags.map(row => row.id));
  const smsRuleIds = new Set(data.sms_rules.map(row => row.id));

  addDuplicateIssues(
    issues,
    'accounts.id',
    data.accounts.map(row => row.id),
  );
  addDuplicateIssues(
    issues,
    'categories.id',
    data.categories.map(row => row.id),
  );
  addDuplicateIssues(
    issues,
    'transactions.id',
    data.transactions.map(row => row.id),
  );
  addDuplicateIssues(
    issues,
    'budgets.id',
    data.budgets.map(row => row.id),
  );
  addDuplicateIssues(
    issues,
    'subscriptions.id',
    data.subscriptions.map(row => row.id),
  );
  addDuplicateIssues(
    issues,
    'recurring_rules.id',
    data.recurring_rules.map(row => row.id),
  );
  addDuplicateIssues(
    issues,
    'sms_rules.id',
    data.sms_rules.map(row => row.id),
  );
  addDuplicateIssues(
    issues,
    'sms_messages.id',
    data.sms_messages.map(row => row.id),
  );
  addDuplicateIssues(
    issues,
    'tags.id',
    data.tags.map(row => row.id),
  );
  addDuplicateIssues(
    issues,
    'fx_rates.id',
    data.fx_rates.map(row => row.id),
  );
  addDuplicateIssues(
    issues,
    'merchant_aliases.id',
    data.merchant_aliases.map(row => row.id),
  );
  addDuplicateIssues(
    issues,
    'settings.key',
    data.settings.map(row => row.key),
  );

  for (const row of data.categories) {
    addReference(issues, `categories.${row.id}.parent_id`, row.parent_id, categoryIds);
  }
  for (const row of data.transactions) {
    addReference(issues, `transactions.${row.id}.account_id`, row.account_id, accountIds);
    addReference(issues, `transactions.${row.id}.category_id`, row.category_id, categoryIds);
    addReference(
      issues,
      `transactions.${row.id}.transfer_pair_id`,
      row.transfer_pair_id,
      transactionIds,
    );
  }
  for (const row of data.budgets) {
    addReference(issues, `budgets.${row.id}.category_id`, row.category_id, categoryIds);
  }
  for (const row of data.subscriptions) {
    addReference(issues, `subscriptions.${row.id}.account_id`, row.account_id, accountIds);
    addReference(issues, `subscriptions.${row.id}.category_id`, row.category_id, categoryIds);
  }
  for (const row of data.recurring_rules) {
    addReference(issues, `recurring_rules.${row.id}.account_id`, row.account_id, accountIds);
    addReference(issues, `recurring_rules.${row.id}.category_id`, row.category_id, categoryIds);
  }
  for (const row of data.sms_rules) {
    addReference(
      issues,
      `sms_rules.${row.id}.default_account_id`,
      row.default_account_id,
      accountIds,
    );
    addReference(
      issues,
      `sms_rules.${row.id}.default_category_id`,
      row.default_category_id,
      categoryIds,
    );
  }
  for (const row of data.sms_messages) {
    addReference(issues, `sms_messages.${row.id}.matched_rule_id`, row.matched_rule_id, smsRuleIds);
    addReference(
      issues,
      `sms_messages.${row.id}.created_transaction_id`,
      row.created_transaction_id,
      transactionIds,
    );
  }
  for (const row of data.merchant_aliases) {
    addReference(issues, `merchant_aliases.${row.id}.category_id`, row.category_id, categoryIds);
  }
  for (const row of data.transaction_tags) {
    addReference(
      issues,
      `transaction_tags.${row.transaction_id}.transaction_id`,
      row.transaction_id,
      transactionIds,
    );
    addReference(issues, `transaction_tags.${row.transaction_id}.tag_id`, row.tag_id, tagIds);
  }

  return issues;
}

function addReference(
  issues: string[],
  path: string,
  value: string | null,
  targets: ReadonlySet<string>,
): void {
  if (value !== null && !targets.has(value)) {
    issues.push(`${path} references missing id "${value}"`);
  }
}

function addDuplicateIssues(issues: string[], path: string, values: readonly string[]): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      issues.push(`${path} contains duplicate "${value}"`);
      return;
    }
    seen.add(value);
  }
}
