/**
 * Abstract SQL executor so migration logic is unit-testable without native SQLite.
 */

export type SqlParams = ReadonlyArray<string | number | boolean | null>;

export type SqlRow = Record<string, string | number | boolean | null>;

export type SqlResult = {
  rows: SqlRow[];
  rowsAffected: number;
  insertId?: number;
};

export type SqlDatabase = {
  execute: (sql: string, params?: SqlParams) => Promise<SqlResult>;
  executeSync?: (sql: string, params?: SqlParams) => SqlResult;
  transaction: (fn: (tx: SqlDatabase) => Promise<void>) => Promise<void>;
};
