import {
  parseCaptureMapJson,
  serializeCaptureMap,
  type SmsCaptureMap,
} from '../../domain/sms/ruleEngine';
import {createId, nowIso} from '../../lib/id';

import {Repository} from './Repository';

import type {SqlDatabase} from '../types';

export type SmsRuleRow = {
  id: string;
  name: string;
  sender_pattern: string;
  body_regex: string;
  capture_map_json: string;
  default_account_id: string | null;
  default_category_id: string | null;
  priority: number;
  enabled: number;
  created_at: string;
  updated_at: string;
};

export type CreateSmsRuleInput = {
  name: string;
  senderPattern: string;
  bodyRegex: string;
  captureMap: SmsCaptureMap;
  priority?: number;
  enabled?: boolean;
  defaultAccountId?: string | null;
  defaultCategoryId?: string | null;
};

export type UpdateSmsRuleInput = Partial<CreateSmsRuleInput>;

function mapRule(row: Record<string, string | number | boolean | null>): SmsRuleRow {
  return {
    id: String(row.id),
    name: String(row.name),
    sender_pattern: String(row.sender_pattern),
    body_regex: String(row.body_regex),
    capture_map_json: String(row.capture_map_json),
    default_account_id:
      row.default_account_id == null ? null : String(row.default_account_id),
    default_category_id:
      row.default_category_id == null ? null : String(row.default_category_id),
    priority: Number(row.priority),
    enabled: Number(row.enabled),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function smsRuleRowToEngine(row: SmsRuleRow) {
  return {
    id: row.id,
    name: row.name,
    senderPattern: row.sender_pattern,
    bodyRegex: row.body_regex,
    captureMap: parseCaptureMapJson(row.capture_map_json),
    priority: row.priority,
    enabled: row.enabled === 1,
    defaultAccountId: row.default_account_id,
    defaultCategoryId: row.default_category_id,
  };
}

export class SmsRulesRepository extends Repository {
  constructor(db: SqlDatabase) {
    super(db);
  }

  async listAll(): Promise<SmsRuleRow[]> {
    const result = await this.query(
      `SELECT * FROM sms_rules ORDER BY priority ASC, name ASC`,
    );
    return result.rows.map(mapRule);
  }

  async listEnabled(): Promise<SmsRuleRow[]> {
    const result = await this.query(
      `SELECT * FROM sms_rules WHERE enabled = 1 ORDER BY priority ASC, name ASC`,
    );
    return result.rows.map(mapRule);
  }

  async getById(id: string): Promise<SmsRuleRow | null> {
    const result = await this.query(`SELECT * FROM sms_rules WHERE id = ?`, [id]);
    const row = result.rows[0];
    return row ? mapRule(row) : null;
  }

  async create(input: CreateSmsRuleInput): Promise<SmsRuleRow> {
    const id = createId();
    const stamped = nowIso();
    await this.run(
      'sms_rules',
      `INSERT INTO sms_rules (
        id, name, sender_pattern, body_regex, capture_map_json,
        default_account_id, default_category_id, priority, enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.senderPattern,
        input.bodyRegex,
        serializeCaptureMap(input.captureMap),
        input.defaultAccountId ?? null,
        input.defaultCategoryId ?? null,
        input.priority ?? 100,
        input.enabled === false ? 0 : 1,
        stamped,
        stamped,
      ],
      [id],
    );
    const created = await this.getById(id);
    if (!created) {
      throw new Error('Failed to create SMS rule');
    }
    return created;
  }

  async update(id: string, input: UpdateSmsRuleInput): Promise<SmsRuleRow> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('SMS rule not found');
    }
    const stamped = nowIso();
    await this.run(
      'sms_rules',
      `UPDATE sms_rules SET
        name = ?,
        sender_pattern = ?,
        body_regex = ?,
        capture_map_json = ?,
        default_account_id = ?,
        default_category_id = ?,
        priority = ?,
        enabled = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        input.name ?? existing.name,
        input.senderPattern ?? existing.sender_pattern,
        input.bodyRegex ?? existing.body_regex,
        input.captureMap
          ? serializeCaptureMap(input.captureMap)
          : existing.capture_map_json,
        input.defaultAccountId !== undefined
          ? input.defaultAccountId
          : existing.default_account_id,
        input.defaultCategoryId !== undefined
          ? input.defaultCategoryId
          : existing.default_category_id,
        input.priority ?? existing.priority,
        input.enabled !== undefined
          ? input.enabled
            ? 1
            : 0
          : existing.enabled,
        stamped,
        id,
      ],
      [id],
    );
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Failed to update SMS rule');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.run('sms_rules', `DELETE FROM sms_rules WHERE id = ?`, [id], [id]);
  }
}
