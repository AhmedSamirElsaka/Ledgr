import {
  memoryKeyForMerchant,
  memoryKeyForSender,
  parseCategoryMemory,
  serializeCategoryMemory,
  SMART_CATEGORY_MEMORY_KEY,
  upsertCategoryMemory,
  type CategoryMemoryEntry,
  type CategoryMemoryKind,
} from '../../domain/smart/categoryMemory';

import type {SettingsRepository} from '../repositories/settingsRepository';

export async function loadCategoryMemory(
  settings: Pick<SettingsRepository, 'get'>,
): Promise<CategoryMemoryEntry[]> {
  const raw = await settings.get(SMART_CATEGORY_MEMORY_KEY);
  return parseCategoryMemory(raw);
}

export async function recordCategoryTeach(
  settings: Pick<SettingsRepository, 'get' | 'set'>,
  input: {
    merchant?: string | null;
    sender?: string | null;
    categoryId: string;
    kind: CategoryMemoryKind;
  },
): Promise<void> {
  if (!input.categoryId) {
    return;
  }
  let entries = await loadCategoryMemory(settings);
  const merchantKey = input.merchant
    ? memoryKeyForMerchant(input.merchant)
    : null;
  if (merchantKey) {
    entries = upsertCategoryMemory(entries, {
      key: merchantKey,
      categoryId: input.categoryId,
      kind: input.kind,
      weightDelta: 2,
    });
  }
  const senderKey = input.sender ? memoryKeyForSender(input.sender) : null;
  if (senderKey) {
    entries = upsertCategoryMemory(entries, {
      key: senderKey,
      categoryId: input.categoryId,
      kind: input.kind,
      weightDelta: 1,
    });
  }
  await settings.set(SMART_CATEGORY_MEMORY_KEY, serializeCategoryMemory(entries));
}
