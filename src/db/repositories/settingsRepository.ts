import {createId, nowIso} from '../../lib/id';

import {Repository} from './Repository';

import type {SqlDatabase} from '../types';

export type SettingKey =
  | 'base_currency'
  | 'onboarding.completed'
  | 'seed.categories.v1'
  | 'theme.appearance'
  | 'app_lock.enabled'
  | string;

export class SettingsRepository extends Repository {
  constructor(db: SqlDatabase) {
    super(db);
  }

  async get(key: SettingKey): Promise<string | null> {
    const result = await this.query(`SELECT value FROM settings WHERE key = ?`, [key]);
    const row = result.rows[0];
    return row && typeof row.value === 'string' ? row.value : null;
  }

  async set(key: SettingKey, value: string): Promise<void> {
    await this.run(
      'settings',
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value, nowIso()],
    );
  }

  async getOrCreateIdempotent(key: SettingKey, value: string): Promise<string> {
    const existing = await this.get(key);
    if (existing !== null) {
      return existing;
    }
    await this.set(key, value);
    return value;
  }
}

/** Tiny helper used by tests / callers that need a fresh settings key. */
export function unusedSettingsKey(): string {
  return `tmp.${createId()}`;
}
