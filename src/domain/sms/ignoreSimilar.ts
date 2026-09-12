/**
 * User-taught “ignore similar” patterns for SMS auto-ingest.
 * Stored as JSON in settings (`sms.ignored_similar`) — no schema migration.
 */

export const SMS_IGNORED_SIMILAR_SETTING_KEY = 'sms.ignored_similar';

export type IgnoreSimilarPattern = {
  /** Normalized sender (trimmed + uppercased). */
  sender: string;
  /** Normalized merchant (trimmed + lowercased), or null = any merchant from sender. */
  merchant: string | null;
};

export function normalizeIgnoreSender(sender: string): string {
  return sender.trim().toUpperCase();
}

export function normalizeIgnoreMerchant(
  merchant: string | null | undefined,
): string | null {
  if (merchant == null) {
    return null;
  }
  const trimmed = merchant.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildIgnoreSimilarPattern(input: {
  sender: string;
  merchant?: string | null;
}): IgnoreSimilarPattern | null {
  const sender = normalizeIgnoreSender(input.sender);
  if (!sender) {
    return null;
  }
  return {
    sender,
    merchant: normalizeIgnoreMerchant(input.merchant),
  };
}

export function matchesIgnoreSimilar(
  patterns: readonly IgnoreSimilarPattern[],
  candidate: {sender: string; merchant?: string | null},
): boolean {
  if (patterns.length === 0) {
    return false;
  }
  const sender = normalizeIgnoreSender(candidate.sender);
  if (!sender) {
    return false;
  }
  const merchant = normalizeIgnoreMerchant(candidate.merchant);
  return patterns.some(pattern => {
    if (pattern.sender !== sender) {
      return false;
    }
    if (pattern.merchant == null) {
      return true;
    }
    return merchant != null && merchant === pattern.merchant;
  });
}

export function upsertIgnoreSimilarPattern(
  patterns: readonly IgnoreSimilarPattern[],
  next: IgnoreSimilarPattern,
): IgnoreSimilarPattern[] {
  const duplicate = patterns.some(
    p => p.sender === next.sender && p.merchant === next.merchant,
  );
  if (duplicate) {
    return [...patterns];
  }

  if (next.merchant == null) {
    return [...patterns.filter(p => p.sender !== next.sender), next];
  }

  if (patterns.some(p => p.sender === next.sender && p.merchant == null)) {
    return [...patterns];
  }

  return [...patterns, next];
}

function asPattern(value: unknown): IgnoreSimilarPattern | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as {sender?: unknown; merchant?: unknown};
  if (typeof row.sender !== 'string') {
    return null;
  }
  const sender = normalizeIgnoreSender(row.sender);
  if (!sender) {
    return null;
  }
  const merchant =
    row.merchant == null || row.merchant === ''
      ? null
      : typeof row.merchant === 'string'
        ? normalizeIgnoreMerchant(row.merchant)
        : null;
  return {sender, merchant};
}

export function parseIgnoredSimilarSetting(raw: string | null): IgnoreSimilarPattern[] {
  if (!raw || !raw.trim()) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const out: IgnoreSimilarPattern[] = [];
    for (const item of parsed) {
      const pattern = asPattern(item);
      if (pattern) {
        out.push(pattern);
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function serializeIgnoredSimilarSetting(
  patterns: readonly IgnoreSimilarPattern[],
): string {
  return JSON.stringify(patterns);
}
