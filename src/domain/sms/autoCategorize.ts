/**
 * Learns category suggestions from merchant history.
 * Requires ≥ `minHits` prior transactions with the same cleaned merchant
 * and the same category.
 */

export type MerchantCategoryHit = {
  merchant: string;
  categoryId: string;
};

export type AutoCategorizeResult = {
  categoryId: string;
  hitCount: number;
  autoAssigned: true;
};

export function suggestCategoryFromHistory(
  merchant: string,
  history: readonly MerchantCategoryHit[],
  minHits = 3,
): AutoCategorizeResult | null {
  const key = merchant.trim().toLowerCase();
  if (!key) {
    return null;
  }

  const counts = new Map<string, number>();
  for (const hit of history) {
    if (hit.merchant.trim().toLowerCase() !== key) {
      continue;
    }
    if (!hit.categoryId) {
      continue;
    }
    counts.set(hit.categoryId, (counts.get(hit.categoryId) ?? 0) + 1);
  }

  let bestId: string | null = null;
  let bestCount = 0;
  for (const [categoryId, count] of counts) {
    if (count > bestCount) {
      bestId = categoryId;
      bestCount = count;
    }
  }

  if (!bestId || bestCount < minHits) {
    return null;
  }

  return {categoryId: bestId, hitCount: bestCount, autoAssigned: true};
}
