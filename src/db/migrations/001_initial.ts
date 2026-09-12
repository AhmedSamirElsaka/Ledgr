import type {Migration} from '../migrate';

/**
 * Schema v1 — normalized domain model. Money columns are INTEGER minor units.
 */
export const migration001Initial: Migration = {
  version: 1,
  name: 'initial_schema',
  statements: [
    `PRAGMA foreign_keys = ON`,

    `CREATE TABLE accounts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'card', 'wallet')),
      currency TEXT NOT NULL,
      opening_balance_minor INTEGER NOT NULL DEFAULT 0,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    `CREATE TABLE categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
      parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    `CREATE TABLE transactions (
      id TEXT PRIMARY KEY NOT NULL,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      category_id TEXT REFERENCES categories(id),
      amount_minor INTEGER NOT NULL,
      currency TEXT NOT NULL,
      fx_rate_to_base REAL NOT NULL DEFAULT 1,
      base_amount_minor INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
      transfer_pair_id TEXT,
      note TEXT,
      merchant TEXT,
      occurred_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('manual', 'sms', 'recurring', 'import')),
      source_ref TEXT,
      deleted_at TEXT,
      auto_categorized INTEGER NOT NULL DEFAULT 0
    )`,

    `CREATE TABLE tags (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,

    `CREATE TABLE transaction_tags (
      transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (transaction_id, tag_id)
    )`,

    `CREATE TABLE budgets (
      id TEXT PRIMARY KEY NOT NULL,
      category_id TEXT REFERENCES categories(id),
      period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'custom')),
      amount_minor INTEGER NOT NULL,
      currency TEXT NOT NULL,
      rollover INTEGER NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    `CREATE TABLE subscriptions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      merchant_matcher TEXT,
      amount_minor INTEGER NOT NULL,
      currency TEXT NOT NULL,
      cycle TEXT NOT NULL CHECK (cycle IN ('monthly', 'yearly', 'custom')),
      custom_days INTEGER,
      next_due_date TEXT NOT NULL,
      account_id TEXT REFERENCES accounts(id),
      category_id TEXT REFERENCES categories(id),
      reminder_days_before INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'paused')),
      icon TEXT,
      color TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    `CREATE TABLE sms_rules (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      sender_pattern TEXT NOT NULL,
      body_regex TEXT NOT NULL,
      capture_map_json TEXT NOT NULL,
      default_account_id TEXT REFERENCES accounts(id),
      default_category_id TEXT REFERENCES categories(id),
      priority INTEGER NOT NULL DEFAULT 100,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    `CREATE TABLE sms_messages (
      id TEXT PRIMARY KEY NOT NULL,
      sender TEXT NOT NULL,
      body TEXT NOT NULL,
      received_at TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('parsed', 'ignored', 'needs_review', 'duplicate')),
      matched_rule_id TEXT REFERENCES sms_rules(id),
      created_transaction_id TEXT REFERENCES transactions(id),
      dedupe_hash TEXT,
      created_at TEXT NOT NULL
    )`,

    `CREATE TABLE recurring_rules (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      category_id TEXT REFERENCES categories(id),
      amount_minor INTEGER NOT NULL,
      currency TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
      cycle TEXT NOT NULL CHECK (cycle IN ('weekly', 'monthly', 'yearly', 'custom')),
      custom_days INTEGER,
      next_occurred_at TEXT NOT NULL,
      note TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    `CREATE TABLE settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    `CREATE TABLE fx_rates (
      id TEXT PRIMARY KEY NOT NULL,
      base_currency TEXT NOT NULL,
      quote_currency TEXT NOT NULL,
      rate REAL NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (base_currency, quote_currency)
    )`,

    `CREATE TABLE merchant_aliases (
      id TEXT PRIMARY KEY NOT NULL,
      raw_merchant TEXT NOT NULL UNIQUE,
      display_merchant TEXT NOT NULL,
      category_id TEXT REFERENCES categories(id),
      hit_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )`,

    // Transaction indexes — every WHERE / ORDER BY column used in list & analytics paths
    `CREATE INDEX idx_transactions_occurred_at ON transactions(occurred_at DESC)`,
    `CREATE INDEX idx_transactions_account_id ON transactions(account_id)`,
    `CREATE INDEX idx_transactions_category_id ON transactions(category_id)`,
    `CREATE INDEX idx_transactions_type ON transactions(type)`,
    `CREATE INDEX idx_transactions_source ON transactions(source)`,
    `CREATE INDEX idx_transactions_deleted_at ON transactions(deleted_at)`,
    `CREATE INDEX idx_transactions_merchant ON transactions(merchant)`,
    `CREATE INDEX idx_transactions_transfer_pair ON transactions(transfer_pair_id)`,
    `CREATE INDEX idx_transactions_list ON transactions(deleted_at, occurred_at DESC)`,
    `CREATE INDEX idx_transactions_account_occurred ON transactions(account_id, deleted_at, occurred_at DESC)`,
    `CREATE INDEX idx_transactions_category_occurred ON transactions(category_id, deleted_at, occurred_at DESC)`,
    `CREATE INDEX idx_transactions_amount ON transactions(amount_minor)`,

    `CREATE INDEX idx_categories_parent ON categories(parent_id)`,
    `CREATE INDEX idx_categories_kind_sort ON categories(kind, sort_order)`,
    `CREATE INDEX idx_accounts_archived ON accounts(archived)`,
    `CREATE INDEX idx_budgets_active ON budgets(active, start_date)`,
    `CREATE INDEX idx_subscriptions_status_due ON subscriptions(status, next_due_date)`,
    `CREATE INDEX idx_sms_messages_status ON sms_messages(status, received_at DESC)`,
    `CREATE INDEX idx_sms_messages_dedupe ON sms_messages(dedupe_hash)`,
    `CREATE INDEX idx_sms_rules_priority ON sms_rules(enabled, priority)`,
    `CREATE INDEX idx_transaction_tags_tag ON transaction_tags(tag_id)`,
    `CREATE INDEX idx_merchant_aliases_raw ON merchant_aliases(raw_merchant)`,
  ],
};
