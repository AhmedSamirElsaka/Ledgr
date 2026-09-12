import type {SqlDatabase, SqlParams, SqlResult} from './types';

export type Migration = {
  version: number;
  name: string;
  /** Statements run in order inside a single transaction. */
  statements: readonly string[];
};

/**
 * Forward-only migrator using SQLite `user_version` pragma.
 */
export async function getUserVersion(db: SqlDatabase): Promise<number> {
  const result = await db.execute('PRAGMA user_version');
  const row = result.rows[0];
  if (!row) {
    return 0;
  }
  const value = row.user_version;
  return typeof value === 'number' ? value : Number(value ?? 0);
}

export async function runMigrations(
  db: SqlDatabase,
  migrations: readonly Migration[],
): Promise<{from: number; to: number}> {
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (!prev || !curr) {
      continue;
    }
    if (curr.version !== prev.version + 1) {
      throw new Error(
        `Migration versions must be contiguous; got ${prev.version} then ${curr.version}`,
      );
    }
  }

  const from = await getUserVersion(db);
  let to = from;

  for (const migration of sorted) {
    if (migration.version <= from) {
      continue;
    }
    await db.transaction(async tx => {
      for (const statement of migration.statements) {
        const trimmed = statement.trim();
        if (trimmed.length === 0) {
          continue;
        }
        await tx.execute(trimmed);
      }
      await tx.execute(`PRAGMA user_version = ${migration.version}`);
    });
    to = migration.version;
  }

  return {from, to};
}

export type {SqlParams, SqlResult};
