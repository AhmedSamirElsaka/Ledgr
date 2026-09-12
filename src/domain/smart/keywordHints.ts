/**
 * Free offline keyword → seeded category name hints.
 * Resolves against the user's category catalog by name (EN seed names).
 */

export type KeywordCategoryHint = {
  /** Matched against merchant + body (normalized). */
  pattern: RegExp;
  /** Must match a leaf category name (case-insensitive). */
  categoryName: string;
};

/** High-signal merchants / phrases common in MENA + global SMS. */
export const KEYWORD_CATEGORY_HINTS: readonly KeywordCategoryHint[] = [
  {pattern: /\b(uber|careem|bolt|didi|inDrive)\b/i, categoryName: 'Ride share'},
  {pattern: /\b(shell|totalenergies|mobil|petrol|بنزين|وقود)\b/i, categoryName: 'Fuel'},
  {
    pattern: /(starbucks|costa|cilantro|dunkin|coffee|قهوة)/i,
    categoryName: 'Coffee & snacks',
  },
  {
    pattern: /\b(talabat|ottomant|elmenus|deliveroo|hungerstation|طلبات)\b/i,
    categoryName: 'Delivery',
  },
  {
    pattern: /\b(carrefour|spinneys|metro market|kazyon|bim|سعودي|العثيم)\b/i,
    categoryName: 'Groceries',
  },
  {
    pattern: /\b(mcdonald|kfc|pizza hut|burger|restaurant|مطعم)\b/i,
    categoryName: 'Restaurants',
  },
  {
    pattern: /\b(amazon|noon|jumia|aliexpress|shein)\b/i,
    categoryName: 'Online marketplaces',
  },
  {
    pattern: /\b(netflix|spotify|disney\+|osn|shahid|youtube premium)\b/i,
    categoryName: 'Streaming',
  },
  {
    pattern: /\b(vodafone|orange|etisalat|we |stc|mobily|زین)\b/i,
    categoryName: 'Internet & mobile',
  },
  {pattern: /\b(pharmacy|seif|el ezaby|صيدلية)\b/i, categoryName: 'Pharmacy'},
  {pattern: /\b(atm|cash withdrawal|سحب نقدي)\b/i, categoryName: 'Fees & ATM'},
  {pattern: /\b(salary|راتب|payroll)\b/i, categoryName: 'Salary'},
];

export type CategoryNameRow = {
  id: string;
  name: string;
};

export function suggestCategoryFromKeywords(
  text: string,
  catalog: readonly CategoryNameRow[],
): {categoryId: string; categoryName: string} | null {
  const hay = text.trim();
  if (!hay || catalog.length === 0) {
    return null;
  }
  const byName = new Map(
    catalog.map(c => [c.name.trim().toLowerCase(), c.id] as const),
  );
  for (const hint of KEYWORD_CATEGORY_HINTS) {
    if (!hint.pattern.test(hay)) {
      continue;
    }
    const id = byName.get(hint.categoryName.toLowerCase());
    if (id) {
      return {categoryId: id, categoryName: hint.categoryName};
    }
  }
  return null;
}
