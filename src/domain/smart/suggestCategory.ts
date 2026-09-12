/**
 * Unified offline category suggestion — memory + history + keywords.
 * No network, no paid APIs.
 */

import {
  suggestCategoryFromHistory,
  type MerchantCategoryHit,
} from '../sms/autoCategorize';

import {
  findMemorySuggestion,
  normalizeMemoryMerchant,
  type CategoryMemoryEntry,
  type CategoryMemoryKind,
} from './categoryMemory';
import {
  suggestCategoryFromKeywords,
  type CategoryNameRow,
} from './keywordHints';

export type SmartSuggestSource = 'memory' | 'history' | 'keyword';

export type SmartCategorySuggestion = {
  categoryId: string;
  source: SmartSuggestSource;
  /** True when safe to auto-apply without asking. */
  autoAssign: boolean;
  hitCount?: number;
  weight?: number;
  labelName?: string;
};

function merchantsFuzzyMatch(a: string, b: string): boolean {
  const left = normalizeMemoryMerchant(a);
  const right = normalizeMemoryMerchant(b);
  if (!left || !right) {
    return false;
  }
  if (left === right) {
    return true;
  }
  if (left.includes(right) || right.includes(left)) {
    return true;
  }
  const leftTokens = new Set(left.split(' ').filter(t => t.length > 2));
  const rightTokens = right.split(' ').filter(t => t.length > 2);
  if (leftTokens.size === 0 || rightTokens.length === 0) {
    return false;
  }
  let overlap = 0;
  for (const token of rightTokens) {
    if (leftTokens.has(token)) {
      overlap += 1;
    }
  }
  return overlap >= 1 && overlap / Math.max(leftTokens.size, rightTokens.length) >= 0.5;
}

export function expandHistoryForMerchant(
  merchant: string,
  history: readonly MerchantCategoryHit[],
): MerchantCategoryHit[] {
  const key = normalizeMemoryMerchant(merchant);
  if (!key) {
    return [];
  }
  return history.filter(hit => merchantsFuzzyMatch(hit.merchant, key));
}

export function suggestCategorySmart(input: {
  merchant?: string | null;
  sender?: string | null;
  body?: string | null;
  kind: CategoryMemoryKind;
  history: readonly MerchantCategoryHit[];
  memory: readonly CategoryMemoryEntry[];
  catalog: readonly CategoryNameRow[];
  /** Auto-assign history threshold (default 3). */
  minHistoryHits?: number;
  /** Soft history threshold (default 2). */
  minSoftHistoryHits?: number;
  /** Memory weight for auto-assign (default 2). */
  minMemoryWeight?: number;
}): SmartCategorySuggestion | null {
  const minHistory = input.minHistoryHits ?? 3;
  const minSoft = input.minSoftHistoryHits ?? 2;
  const minMemory = input.minMemoryWeight ?? 2;

  const memoryHit = findMemorySuggestion(input.memory, {
    merchant: input.merchant,
    sender: input.sender,
    kind: input.kind,
    minWeight: 1,
  });
  if (memoryHit && memoryHit.weight >= minMemory) {
    return {
      categoryId: memoryHit.categoryId,
      source: 'memory',
      autoAssign: true,
      weight: memoryHit.weight,
    };
  }
  if (memoryHit) {
    return {
      categoryId: memoryHit.categoryId,
      source: 'memory',
      autoAssign: false,
      weight: memoryHit.weight,
    };
  }

  const merchant = input.merchant?.trim() ?? '';
  if (merchant) {
    const fuzzyHistory = expandHistoryForMerchant(merchant, input.history).map(
      hit => ({
        merchant,
        categoryId: hit.categoryId,
      }),
    );
    const strong = suggestCategoryFromHistory(merchant, fuzzyHistory, minHistory);
    if (strong) {
      return {
        categoryId: strong.categoryId,
        source: 'history',
        autoAssign: true,
        hitCount: strong.hitCount,
      };
    }
    const soft = suggestCategoryFromHistory(merchant, fuzzyHistory, minSoft);
    if (soft) {
      return {
        categoryId: soft.categoryId,
        source: 'history',
        autoAssign: false,
        hitCount: soft.hitCount,
      };
    }
  }

  const keywordText = [merchant, input.body ?? '', input.sender ?? '']
    .filter(Boolean)
    .join(' ');
  const keyword = suggestCategoryFromKeywords(keywordText, input.catalog);
  if (keyword) {
    return {
      categoryId: keyword.categoryId,
      source: 'keyword',
      autoAssign: false,
      labelName: keyword.categoryName,
    };
  }

  return null;
}
