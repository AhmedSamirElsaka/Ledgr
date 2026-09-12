/**
 * On-device category teaching memory — free, offline, private.
 * Stored in settings as JSON (`smart.category_memory`).
 */

export const SMART_CATEGORY_MEMORY_KEY = 'smart.category_memory';

export type CategoryMemoryKind = 'expense' | 'income';

export type CategoryMemoryEntry = {
  /** Normalized merchant or `sender:<SENDER>`. */
  key: string;
  categoryId: string;
  kind: CategoryMemoryKind;
  /** Cumulative teach weight (explicit confirmations). */
  weight: number;
  updatedAt: string;
};

export function normalizeMemoryMerchant(merchant: string): string {
  return merchant.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function memoryKeyForMerchant(merchant: string): string | null {
  const key = normalizeMemoryMerchant(merchant);
  return key.length > 0 ? key : null;
}

export function memoryKeyForSender(sender: string): string | null {
  const trimmed = sender.trim().toUpperCase();
  return trimmed.length > 0 ? `sender:${trimmed}` : null;
}

export function upsertCategoryMemory(
  entries: readonly CategoryMemoryEntry[],
  input: {
    key: string;
    categoryId: string;
    kind: CategoryMemoryKind;
    weightDelta?: number;
    nowIso?: string;
  },
): CategoryMemoryEntry[] {
  const weightDelta = input.weightDelta ?? 2;
  const nowIso = input.nowIso ?? new Date().toISOString();
  const next = entries.filter(
    e => !(e.key === input.key && e.kind === input.kind),
  );
  const prev = entries.find(e => e.key === input.key && e.kind === input.kind);
  const sameCategory = prev?.categoryId === input.categoryId;
  next.push({
    key: input.key,
    categoryId: input.categoryId,
    kind: input.kind,
    weight: sameCategory ? (prev?.weight ?? 0) + weightDelta : weightDelta,
    updatedAt: nowIso,
  });
  // Cap growth — keep most recently updated.
  next.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return next.slice(0, 200);
}

function asEntry(value: unknown): CategoryMemoryEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as Record<string, unknown>;
  if (typeof row.key !== 'string' || !row.key.trim()) {
    return null;
  }
  if (typeof row.categoryId !== 'string' || !row.categoryId) {
    return null;
  }
  if (row.kind !== 'expense' && row.kind !== 'income') {
    return null;
  }
  const weight = typeof row.weight === 'number' && row.weight > 0 ? row.weight : 1;
  const updatedAt =
    typeof row.updatedAt === 'string' && row.updatedAt ? row.updatedAt : new Date(0).toISOString();
  return {
    key: row.key.trim(),
    categoryId: row.categoryId,
    kind: row.kind,
    weight,
    updatedAt,
  };
}

export function parseCategoryMemory(raw: string | null): CategoryMemoryEntry[] {
  if (!raw?.trim()) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const out: CategoryMemoryEntry[] = [];
    for (const item of parsed) {
      const entry = asEntry(item);
      if (entry) {
        out.push(entry);
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function serializeCategoryMemory(
  entries: readonly CategoryMemoryEntry[],
): string {
  return JSON.stringify(entries);
}

export function findMemorySuggestion(
  entries: readonly CategoryMemoryEntry[],
  input: {
    merchant?: string | null;
    sender?: string | null;
    kind: CategoryMemoryKind;
    minWeight?: number;
  },
): CategoryMemoryEntry | null {
  const minWeight = input.minWeight ?? 2;
  const merchantKey = input.merchant
    ? memoryKeyForMerchant(input.merchant)
    : null;
  const senderKey = input.sender ? memoryKeyForSender(input.sender) : null;

  const candidates = entries.filter(e => e.kind === input.kind);
  const merchantHit = merchantKey
    ? candidates.find(e => e.key === merchantKey && e.weight >= minWeight)
    : null;
  if (merchantHit) {
    return merchantHit;
  }
  const senderHit = senderKey
    ? candidates.find(e => e.key === senderKey && e.weight >= minWeight)
    : null;
  return senderHit ?? null;
}
