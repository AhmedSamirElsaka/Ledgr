import {
  findMemorySuggestion,
  memoryKeyForMerchant,
  memoryKeyForSender,
  parseCategoryMemory,
  serializeCategoryMemory,
  upsertCategoryMemory,
} from '../categoryMemory';
import {suggestCategoryFromKeywords} from '../keywordHints';
import {suggestCategorySmart} from '../suggestCategory';

describe('categoryMemory', () => {
  it('upserts and strengthens matching teaches', () => {
    const first = upsertCategoryMemory([], {
      key: 'uber',
      categoryId: 'ride',
      kind: 'expense',
      weightDelta: 2,
      nowIso: '2026-01-01T00:00:00.000Z',
    });
    expect(first).toHaveLength(1);
    expect(first[0]?.weight).toBe(2);

    const second = upsertCategoryMemory(first, {
      key: 'uber',
      categoryId: 'ride',
      kind: 'expense',
      weightDelta: 2,
      nowIso: '2026-01-02T00:00:00.000Z',
    });
    expect(second).toHaveLength(1);
    expect(second[0]?.weight).toBe(4);
  });

  it('resets weight when category changes', () => {
    const first = upsertCategoryMemory([], {
      key: 'uber',
      categoryId: 'ride',
      kind: 'expense',
      nowIso: '2026-01-01T00:00:00.000Z',
    });
    const next = upsertCategoryMemory(first, {
      key: 'uber',
      categoryId: 'food',
      kind: 'expense',
      nowIso: '2026-01-02T00:00:00.000Z',
    });
    expect(next[0]?.categoryId).toBe('food');
    expect(next[0]?.weight).toBe(2);
  });

  it('round-trips JSON settings', () => {
    const entries = upsertCategoryMemory([], {
      key: memoryKeyForMerchant('Careem')!,
      categoryId: 'ride',
      kind: 'expense',
    });
    const raw = serializeCategoryMemory(entries);
    expect(parseCategoryMemory(raw)).toEqual(entries);
  });

  it('finds merchant before sender memory', () => {
    let entries = upsertCategoryMemory([], {
      key: memoryKeyForSender('CIB')!,
      categoryId: 'other',
      kind: 'expense',
      weightDelta: 4,
    });
    entries = upsertCategoryMemory(entries, {
      key: memoryKeyForMerchant('Uber')!,
      categoryId: 'ride',
      kind: 'expense',
      weightDelta: 2,
    });
    expect(
      findMemorySuggestion(entries, {
        merchant: 'Uber',
        sender: 'CIB',
        kind: 'expense',
        minWeight: 2,
      })?.categoryId,
    ).toBe('ride');
  });
});

describe('keywordHints', () => {
  const catalog = [
    {id: 'ride', name: 'Ride share'},
    {id: 'coffee', name: 'Coffee & snacks'},
    {id: 'salary', name: 'Salary'},
  ];

  it('maps Uber to Ride share', () => {
    expect(suggestCategoryFromKeywords('UBER TRIP CAIRO', catalog)).toEqual({
      categoryId: 'ride',
      categoryName: 'Ride share',
    });
  });

  it('maps Arabic coffee', () => {
    expect(suggestCategoryFromKeywords('شراء قهوة', catalog)?.categoryId).toBe(
      'coffee',
    );
  });
});

describe('suggestCategorySmart', () => {
  const catalog = [
    {id: 'ride', name: 'Ride share'},
    {id: 'food', name: 'Restaurants'},
  ];

  it('prefers strong memory over history', () => {
    const memory = upsertCategoryMemory([], {
      key: 'uber',
      categoryId: 'ride',
      kind: 'expense',
      weightDelta: 2,
    });
    const suggestion = suggestCategorySmart({
      merchant: 'Uber',
      kind: 'expense',
      history: [
        {merchant: 'Uber', categoryId: 'food'},
        {merchant: 'Uber', categoryId: 'food'},
        {merchant: 'Uber', categoryId: 'food'},
      ],
      memory,
      catalog,
    });
    expect(suggestion).toMatchObject({
      categoryId: 'ride',
      source: 'memory',
      autoAssign: true,
    });
  });

  it('soft-suggests from two history hits', () => {
    const suggestion = suggestCategorySmart({
      merchant: 'Uber',
      kind: 'expense',
      history: [
        {merchant: 'Uber', categoryId: 'ride'},
        {merchant: 'Uber', categoryId: 'ride'},
      ],
      memory: [],
      catalog,
    });
    expect(suggestion).toMatchObject({
      categoryId: 'ride',
      source: 'history',
      autoAssign: false,
      hitCount: 2,
    });
  });

  it('fuzzy-matches merchant variants', () => {
    const suggestion = suggestCategorySmart({
      merchant: 'Uber Trip',
      kind: 'expense',
      history: [
        {merchant: 'UBER', categoryId: 'ride'},
        {merchant: 'uber', categoryId: 'ride'},
        {merchant: 'Uber', categoryId: 'ride'},
      ],
      memory: [],
      catalog,
    });
    expect(suggestion?.autoAssign).toBe(true);
    expect(suggestion?.categoryId).toBe('ride');
  });

  it('falls back to keyword hints', () => {
    const suggestion = suggestCategorySmart({
      merchant: null,
      body: 'Paid via Careem',
      kind: 'expense',
      history: [],
      memory: [],
      catalog,
    });
    expect(suggestion).toMatchObject({
      categoryId: 'ride',
      source: 'keyword',
      autoAssign: false,
    });
  });
});
