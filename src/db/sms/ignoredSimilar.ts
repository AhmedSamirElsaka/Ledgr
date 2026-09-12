import {
  buildIgnoreSimilarPattern,
  parseIgnoredSimilarSetting,
  serializeIgnoredSimilarSetting,
  SMS_IGNORED_SIMILAR_SETTING_KEY,
  upsertIgnoreSimilarPattern,
  type IgnoreSimilarPattern,
} from '../../domain/sms/ignoreSimilar';

import type {SettingsRepository} from '../repositories/settingsRepository';

export async function loadIgnoredSimilarPatterns(
  settings: Pick<SettingsRepository, 'get'>,
): Promise<IgnoreSimilarPattern[]> {
  const raw = await settings.get(SMS_IGNORED_SIMILAR_SETTING_KEY);
  return parseIgnoredSimilarSetting(raw);
}

export async function addIgnoredSimilarPattern(
  settings: Pick<SettingsRepository, 'get' | 'set'>,
  input: {sender: string; merchant?: string | null},
): Promise<IgnoreSimilarPattern | null> {
  const pattern = buildIgnoreSimilarPattern(input);
  if (!pattern) {
    return null;
  }
  const existing = await loadIgnoredSimilarPatterns(settings);
  const next = upsertIgnoreSimilarPattern(existing, pattern);
  const serialized = serializeIgnoredSimilarSetting(next);
  if (serialized !== serializeIgnoredSimilarSetting(existing)) {
    await settings.set(SMS_IGNORED_SIMILAR_SETTING_KEY, serialized);
  }
  return pattern;
}
