import {emitDbChange} from '../events';

import type {DbChangeTable} from '../events';
import type {SqlDatabase, SqlParams, SqlResult} from '../types';

export abstract class Repository {
  protected constructor(protected readonly db: SqlDatabase) {}

  protected async query(sql: string, params?: SqlParams): Promise<SqlResult> {
    return this.db.execute(sql, params);
  }

  protected async run(
    table: DbChangeTable,
    sql: string,
    params?: SqlParams,
    ids?: readonly string[],
  ): Promise<SqlResult> {
    const result = await this.db.execute(sql, params);
    emitDbChange({table, ids});
    return result;
  }

  protected async withTransaction(fn: (tx: SqlDatabase) => Promise<void>): Promise<void> {
    await this.db.transaction(fn);
  }
}
