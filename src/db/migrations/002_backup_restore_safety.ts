import type {Migration} from '../migrate';

/**
 * Forward-only safety migration for installs that reached schema v1 before
 * recurring rules were included in full backup/restore.
 */
export const migration002BackupRestoreSafety: Migration = {
  version: 2,
  name: 'backup_restore_safety',
  statements: [
    `CREATE TABLE IF NOT EXISTS recurring_rules (
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
    `CREATE INDEX IF NOT EXISTS idx_recurring_rules_active_due
      ON recurring_rules(active, next_occurred_at)`,
  ],
};
