import type {Migration} from '../migrate';

/**
 * Optional receipt photo path on transactions.
 * Stores an app-private relative path (e.g. receipts/<id>.jpg), never a public URI.
 */
export const migration003ReceiptPath: Migration = {
  version: 3,
  name: 'receipt_path',
  statements: [
    `ALTER TABLE transactions ADD COLUMN receipt_path TEXT`,
  ],
};
