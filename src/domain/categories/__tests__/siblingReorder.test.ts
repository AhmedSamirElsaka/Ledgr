import {
  flattenCategoryTree,
  siblingIndexAfterDrag,
  siblingReorderPatches,
  siblingReorderToIndex,
} from '../siblingReorder';

describe('siblingReorder', () => {
  const rows = [
    {id: 'p1', parent_id: null, sort_order: 0},
    {id: 'c1', parent_id: 'p1', sort_order: 0},
    {id: 'c2', parent_id: 'p1', sort_order: 1},
    {id: 'p2', parent_id: null, sort_order: 1},
  ];

  it('swaps siblings without touching other parents', () => {
    expect(siblingReorderPatches(rows, 'c1', 'down')).toEqual([
      {id: 'c1', sortOrder: 1},
      {id: 'c2', sortOrder: 0},
    ]);
    expect(siblingReorderPatches(rows, 'p1', 'down')).toEqual([
      {id: 'p1', sortOrder: 1},
      {id: 'p2', sortOrder: 0},
    ]);
  });

  it('returns null at edges', () => {
    expect(siblingReorderPatches(rows, 'c1', 'up')).toBeNull();
    expect(siblingReorderPatches(rows, 'p2', 'down')).toBeNull();
  });

  it('moves a sibling to an arbitrary index', () => {
    const three = [
      {id: 'a', parent_id: null, sort_order: 0},
      {id: 'b', parent_id: null, sort_order: 1},
      {id: 'c', parent_id: null, sort_order: 2},
    ];
    expect(siblingReorderToIndex(three, 'a', 2)).toEqual([
      {id: 'b', sortOrder: 0},
      {id: 'c', sortOrder: 1},
      {id: 'a', sortOrder: 2},
    ]);
    expect(siblingReorderToIndex(three, 'c', 0)).toEqual([
      {id: 'c', sortOrder: 0},
      {id: 'a', sortOrder: 1},
      {id: 'b', sortOrder: 2},
    ]);
    expect(siblingReorderToIndex(three, 'b', 1)).toBeNull();
  });

  it('keeps nested moves inside the same parent', () => {
    expect(siblingReorderToIndex(rows, 'c2', 0)).toEqual([
      {id: 'c2', sortOrder: 0},
      {id: 'c1', sortOrder: 1},
    ]);
  });

  it('picks the closest sibling slot after a vertical drag', () => {
    const layouts = [
      {y: 0, height: 60},
      {y: 200, height: 60},
      {y: 400, height: 60},
    ];
    expect(siblingIndexAfterDrag(layouts, 0, 30)).toBe(0);
    expect(siblingIndexAfterDrag(layouts, 0, 180)).toBe(1);
    expect(siblingIndexAfterDrag(layouts, 0, 380)).toBe(2);
    expect(siblingIndexAfterDrag(layouts, 2, -220)).toBe(1);
  });

  it('flattens parents then children', () => {
    expect(flattenCategoryTree(rows).map(r => r.id)).toEqual([
      'p1',
      'c1',
      'c2',
      'p2',
    ]);
  });
});
