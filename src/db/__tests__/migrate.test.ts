import {getUserVersion, runMigrations, type Migration} from '../migrate';
import {migrations} from '../migrations';
import {migration002BackupRestoreSafety} from '../migrations/002_backup_restore_safety';
import {migration003ReceiptPath} from '../migrations/003_receipt_path';

import type {SqlDatabase, SqlResult} from '../types';

function createFakeDb(initialVersion = 0): {
  db: SqlDatabase;
  getVersion: () => number;
  getExecuted: () => string[];
} {
  let version = initialVersion;
  const executed: string[] = [];

  const execute = async (sql: string): Promise<SqlResult> => {
    const trimmed = sql.trim();
    if (trimmed === 'PRAGMA user_version') {
      return {rows: [{user_version: version}], rowsAffected: 0};
    }
    const match = /^PRAGMA user_version\s*=\s*(\d+)$/i.exec(trimmed);
    if (match?.[1]) {
      version = Number(match[1]);
      executed.push(trimmed);
      return {rows: [], rowsAffected: 0};
    }
    executed.push(trimmed);
    return {rows: [], rowsAffected: 0};
  };

  const db: SqlDatabase = {
    execute,
    transaction: async fn => {
      await fn(db);
    },
  };

  return {
    db,
    getVersion: () => version,
    getExecuted: () => executed,
  };
}

describe('runMigrations', () => {
  const m1: Migration = {
    version: 1,
    name: 'one',
    statements: ['CREATE TABLE a (id TEXT)', 'CREATE INDEX idx_a ON a(id)'],
  };
  const m2: Migration = {
    version: 2,
    name: 'two',
    statements: ['ALTER TABLE a ADD COLUMN name TEXT'],
  };

  it('applies pending migrations and bumps user_version', async () => {
    const fake = createFakeDb();
    const result = await runMigrations(fake.db, [m1, m2]);
    expect(result).toEqual({from: 0, to: 2});
    expect(fake.getVersion()).toBe(2);
    expect(fake.getExecuted()).toContain('CREATE TABLE a (id TEXT)');
    expect(fake.getExecuted()).toContain('ALTER TABLE a ADD COLUMN name TEXT');
  });

  it('is idempotent when already at latest version', async () => {
    const fake = createFakeDb();
    await runMigrations(fake.db, [m1, m2]);
    const before = fake.getExecuted().length;
    const result = await runMigrations(fake.db, [m1, m2]);
    expect(result).toEqual({from: 2, to: 2});
    expect(fake.getExecuted().length).toBe(before);
  });

  it('rejects non-contiguous versions', async () => {
    const fake = createFakeDb();
    await expect(runMigrations(fake.db, [m1, {...m2, version: 3}])).rejects.toThrow(/contiguous/);
  });

  it('reads user_version via getUserVersion', async () => {
    const fake = createFakeDb();
    await runMigrations(fake.db, [m1]);
    await expect(getUserVersion(fake.db)).resolves.toBe(1);
  });

  it('applies migration 002 forward without replacing existing schema', async () => {
    const fake = createFakeDb(1);
    const result = await runMigrations(fake.db, [m1, migration002BackupRestoreSafety]);

    expect(result).toEqual({from: 1, to: 2});
    expect(fake.getExecuted()).toEqual(
      expect.arrayContaining([
        expect.stringContaining('CREATE TABLE IF NOT EXISTS recurring_rules'),
        expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_recurring_rules_active_due'),
      ]),
    );
    expect(fake.getExecuted()).not.toContain('CREATE TABLE a (id TEXT)');
  });

  it('applies migration 003 receipt_path forward from v2', async () => {
    const fake = createFakeDb(2);
    const result = await runMigrations(fake.db, [
      m1,
      migration002BackupRestoreSafety,
      migration003ReceiptPath,
    ]);

    expect(result).toEqual({from: 2, to: 3});
    expect(fake.getExecuted()).toEqual(
      expect.arrayContaining([
        expect.stringContaining('ALTER TABLE transactions ADD COLUMN receipt_path TEXT'),
      ]),
    );
  });

  it('applies the shipped migrations chain from 0 → 4', async () => {
    const fake = createFakeDb();
    const result = await runMigrations(fake.db, migrations);

    expect(result).toEqual({from: 0, to: 4});
    expect(fake.getVersion()).toBe(4);
    expect(fake.getExecuted()).toEqual(
      expect.arrayContaining([
        expect.stringContaining('CREATE TABLE IF NOT EXISTS recurring_rules'),
        expect.stringContaining('ALTER TABLE transactions ADD COLUMN receipt_path TEXT'),
      ]),
    );

    const before = fake.getExecuted().length;
    const second = await runMigrations(fake.db, migrations);
    expect(second).toEqual({from: 4, to: 4});
    expect(fake.getExecuted().length).toBe(before);
  });
});
