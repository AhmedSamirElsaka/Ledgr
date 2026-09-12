import {createId, nowIso} from '../../lib/id';

import {Repository} from './Repository';

import type {SqlDatabase} from '../types';

export type SmsMessageStatus = 'parsed' | 'ignored' | 'needs_review' | 'duplicate';

export type SmsMessageRow = {
  id: string;
  sender: string;
  body: string;
  received_at: string;
  status: SmsMessageStatus;
  matched_rule_id: string | null;
  created_transaction_id: string | null;
  dedupe_hash: string | null;
  fingerprint: string | null;
  device_sms_id: string | null;
  parse_method: string | null;
  parse_confidence: number | null;
  parse_reason: string | null;
  extracted_reference: string | null;
  created_at: string;
};

export type CreateSmsMessageInput = {
  sender: string;
  body: string;
  receivedAt: string;
  status: SmsMessageStatus;
  matchedRuleId?: string | null;
  createdTransactionId?: string | null;
  dedupeHash?: string | null;
  fingerprint?: string | null;
  deviceSmsId?: string | null;
  parseMethod?: string | null;
  parseConfidence?: number | null;
  parseReason?: string | null;
  extractedReference?: string | null;
};

function mapStatus(raw: string): SmsMessageStatus {
  if (
    raw === 'parsed' ||
    raw === 'ignored' ||
    raw === 'needs_review' ||
    raw === 'duplicate'
  ) {
    return raw;
  }
  return 'needs_review';
}

function mapMessage(row: Record<string, string | number | boolean | null>): SmsMessageRow {
  return {
    id: String(row.id),
    sender: String(row.sender),
    body: String(row.body),
    received_at: String(row.received_at),
    status: mapStatus(String(row.status)),
    matched_rule_id: row.matched_rule_id == null ? null : String(row.matched_rule_id),
    created_transaction_id:
      row.created_transaction_id == null ? null : String(row.created_transaction_id),
    dedupe_hash: row.dedupe_hash == null ? null : String(row.dedupe_hash),
    fingerprint: row.fingerprint == null ? null : String(row.fingerprint),
    device_sms_id: row.device_sms_id == null ? null : String(row.device_sms_id),
    parse_method: row.parse_method == null ? null : String(row.parse_method),
    parse_confidence:
      row.parse_confidence == null ? null : Number(row.parse_confidence),
    parse_reason: row.parse_reason == null ? null : String(row.parse_reason),
    extracted_reference:
      row.extracted_reference == null ? null : String(row.extracted_reference),
    created_at: String(row.created_at),
  };
}

export class SmsMessagesRepository extends Repository {
  constructor(db: SqlDatabase) {
    super(db);
  }

  async listByStatus(status: SmsMessageStatus, limit = 200): Promise<SmsMessageRow[]> {
    const result = await this.query(
      `SELECT * FROM sms_messages
       WHERE status = ?
       ORDER BY received_at DESC
       LIMIT ?`,
      [status, limit],
    );
    return result.rows.map(mapMessage);
  }

  async listRecent(limit = 100): Promise<SmsMessageRow[]> {
    const result = await this.query(
      `SELECT * FROM sms_messages ORDER BY received_at DESC LIMIT ?`,
      [limit],
    );
    return result.rows.map(mapMessage);
  }

  async getById(id: string): Promise<SmsMessageRow | null> {
    const result = await this.query(`SELECT * FROM sms_messages WHERE id = ?`, [id]);
    const row = result.rows[0];
    return row ? mapMessage(row) : null;
  }

  async findByDedupeHash(hash: string): Promise<SmsMessageRow | null> {
    const result = await this.query(
      `SELECT * FROM sms_messages WHERE dedupe_hash = ? LIMIT 1`,
      [hash],
    );
    const row = result.rows[0];
    return row ? mapMessage(row) : null;
  }

  async findByFingerprint(fingerprint: string): Promise<SmsMessageRow | null> {
    const result = await this.query(
      `SELECT * FROM sms_messages WHERE fingerprint = ? LIMIT 1`,
      [fingerprint],
    );
    const row = result.rows[0];
    return row ? mapMessage(row) : null;
  }

  async findByCreatedTransactionId(
    transactionId: string,
  ): Promise<SmsMessageRow | null> {
    const result = await this.query(
      `SELECT * FROM sms_messages WHERE created_transaction_id = ? LIMIT 1`,
      [transactionId],
    );
    const row = result.rows[0];
    return row ? mapMessage(row) : null;
  }

  async findParsedByDedupeHash(hash: string): Promise<SmsMessageRow | null> {
    const result = await this.query(
      `SELECT * FROM sms_messages WHERE dedupe_hash = ? AND status = 'parsed' LIMIT 1`,
      [hash],
    );
    const row = result.rows[0];
    return row ? mapMessage(row) : null;
  }

  async create(input: CreateSmsMessageInput): Promise<SmsMessageRow> {
    const id = createId();
    const stamped = nowIso();
    await this.run(
      'sms_messages',
      `INSERT INTO sms_messages (
        id, sender, body, received_at, status, matched_rule_id,
        created_transaction_id, dedupe_hash, fingerprint, device_sms_id,
        parse_method, parse_confidence, parse_reason, extracted_reference, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.sender,
        input.body,
        input.receivedAt,
        input.status,
        input.matchedRuleId ?? null,
        input.createdTransactionId ?? null,
        input.dedupeHash ?? null,
        input.fingerprint ?? null,
        input.deviceSmsId ?? null,
        input.parseMethod ?? null,
        input.parseConfidence ?? null,
        input.parseReason ?? null,
        input.extractedReference ?? null,
        stamped,
      ],
      [id],
    );
    const created = await this.getById(id);
    if (!created) {
      throw new Error('Failed to create SMS message');
    }
    return created;
  }

  async updateStatus(
    id: string,
    status: SmsMessageStatus,
    extras?: {
      matchedRuleId?: string | null;
      createdTransactionId?: string | null;
      dedupeHash?: string | null;
      fingerprint?: string | null;
      parseMethod?: string | null;
      parseConfidence?: number | null;
      parseReason?: string | null;
      extractedReference?: string | null;
    },
  ): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('SMS message not found');
    }
    await this.run(
      'sms_messages',
      `UPDATE sms_messages SET
        status = ?,
        matched_rule_id = ?,
        created_transaction_id = ?,
        dedupe_hash = ?,
        fingerprint = ?,
        parse_method = ?,
        parse_confidence = ?,
        parse_reason = ?,
        extracted_reference = ?
       WHERE id = ?`,
      [
        status,
        extras?.matchedRuleId !== undefined
          ? extras.matchedRuleId
          : existing.matched_rule_id,
        extras?.createdTransactionId !== undefined
          ? extras.createdTransactionId
          : existing.created_transaction_id,
        extras?.dedupeHash !== undefined ? extras.dedupeHash : existing.dedupe_hash,
        extras?.fingerprint !== undefined ? extras.fingerprint : existing.fingerprint,
        extras?.parseMethod !== undefined ? extras.parseMethod : existing.parse_method,
        extras?.parseConfidence !== undefined
          ? extras.parseConfidence
          : existing.parse_confidence,
        extras?.parseReason !== undefined ? extras.parseReason : existing.parse_reason,
        extras?.extractedReference !== undefined
          ? extras.extractedReference
          : existing.extracted_reference,
        id,
      ],
      [id],
    );
  }

  async countByStatus(status: SmsMessageStatus): Promise<number> {
    const result = await this.query(
      `SELECT COUNT(*) AS c FROM sms_messages WHERE status = ?`,
      [status],
    );
    return Number(result.rows[0]?.c ?? 0);
  }
}
