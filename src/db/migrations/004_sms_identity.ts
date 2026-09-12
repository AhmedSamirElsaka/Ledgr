import type {Migration} from '../migrate';

/**
 * SMS identity + parse metadata for idempotent import and confidence gating.
 */
export const migration004SmsIdentity: Migration = {
  version: 4,
  name: 'sms_identity_metadata',
  statements: [
    `ALTER TABLE sms_messages ADD COLUMN fingerprint TEXT`,
    `ALTER TABLE sms_messages ADD COLUMN device_sms_id TEXT`,
    `ALTER TABLE sms_messages ADD COLUMN parse_method TEXT`,
    `ALTER TABLE sms_messages ADD COLUMN parse_confidence INTEGER`,
    `ALTER TABLE sms_messages ADD COLUMN parse_reason TEXT`,
    `ALTER TABLE sms_messages ADD COLUMN extracted_reference TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_messages_fingerprint
      ON sms_messages(fingerprint) WHERE fingerprint IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_sms_messages_device_id
      ON sms_messages(device_sms_id) WHERE device_sms_id IS NOT NULL`,
  ],
};
