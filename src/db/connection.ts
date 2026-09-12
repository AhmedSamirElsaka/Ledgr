import {open, type DB} from '@op-engineering/op-sqlite';

import {runMigrations} from './migrate';
import {migrations} from './migrations/index';
import {purgeExpiredTrash} from './purge';
import {seedIfNeeded} from './seed';

import type {SqlDatabase, SqlParams, SqlResult} from './types';

const DB_NAME = 'expense_tracker.db';

let database: DB | null = null;
let ready: Promise<DB> | null = null;

function wrap(db: DB): SqlDatabase {
  return {
    execute: async (sql: string, params?: SqlParams): Promise<SqlResult> => {
      const result = await db.execute(sql, params ? [...params] : undefined);
      return {
        rows: result.rows as SqlResult['rows'],
        rowsAffected: result.rowsAffected,
        insertId: result.insertId,
      };
    },
    executeSync: (sql: string, params?: SqlParams): SqlResult => {
      const result = db.executeSync(sql, params ? [...params] : undefined);
      return {
        rows: result.rows as SqlResult['rows'],
        rowsAffected: result.rowsAffected,
        insertId: result.insertId,
      };
    },
    transaction: async fn => {
      await db.transaction(async tx => {
        const wrappedTx: SqlDatabase = {
          execute: async (sql, params) => {
            const result = await tx.execute(sql, params ? [...params] : undefined);
            return {
              rows: result.rows as SqlResult['rows'],
              rowsAffected: result.rowsAffected,
              insertId: result.insertId,
            };
          },
          transaction: async inner => {
            await inner(wrappedTx);
          },
        };
        await fn(wrappedTx);
      });
    },
  };
}

export async function initDatabase(): Promise<SqlDatabase> {
  if (!ready) {
    ready = (async () => {
      const db = open({name: DB_NAME});
      const sql = wrap(db);
      await sql.execute('PRAGMA foreign_keys = ON');
      await runMigrations(sql, migrations);
      await seedIfNeeded(sql);
      await purgeExpiredTrash(sql);
      database = db;
      return db;
    })().catch(err => {
      // Allow retry after a failed open (do not stick on a rejected promise).
      ready = null;
      database = null;
      throw err;
    });
  }
  await ready;
  if (!database) {
    throw new Error('Database failed to initialize');
  }
  return wrap(database);
}

export function getDatabase(): SqlDatabase {
  if (!database) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return wrap(database);
}

export async function closeDatabase(): Promise<void> {
  if (database) {
    database.close();
  }
  database = null;
  ready = null;
}
