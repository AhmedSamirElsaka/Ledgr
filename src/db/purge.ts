import {deleteReceiptFiles} from './receipts/receiptStorage';

import type {SqlDatabase} from './types';

const TRASH_DAYS = 30;

/**
 * Hard-delete soft-deleted transactions (and orphaned tag links via CASCADE)
 * older than 30 days. Also removes managed receipt files for those rows.
 */
export async function purgeExpiredTrash(db: SqlDatabase): Promise<number> {
  const pathsResult = await db.execute(
    `SELECT receipt_path FROM transactions
     WHERE deleted_at IS NOT NULL
       AND deleted_at < datetime('now', ?)
       AND receipt_path IS NOT NULL`,
    [`-${TRASH_DAYS} days`],
  );
  const receiptPaths = pathsResult.rows
    .map(row => (row.receipt_path == null ? null : String(row.receipt_path)))
    .filter((path): path is string => path != null && path.length > 0);

  const result = await db.execute(
    `DELETE FROM transactions
     WHERE deleted_at IS NOT NULL
       AND deleted_at < datetime('now', ?)`,
    [`-${TRASH_DAYS} days`],
  );

  if (receiptPaths.length > 0) {
    await deleteReceiptFiles(receiptPaths);
  }

  return result.rowsAffected;
}
