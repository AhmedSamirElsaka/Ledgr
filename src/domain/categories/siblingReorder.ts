export type SortableCategory = {
  id: string;
  parent_id: string | null;
  sort_order: number;
};

export type SortOrderPatch = {id: string; sortOrder: number};

export type SiblingLayout = {y: number; height: number};

function sortedSiblings<T extends SortableCategory>(
  items: readonly T[],
  parentId: string | null,
): T[] {
  return items
    .filter(row => row.parent_id === parentId)
    .slice()
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.id.localeCompare(b.id);
    });
}

/**
 * Swap a category with the adjacent sibling (same parent_id) in the given
 * direction. Returns patches for both rows, or null when the move is a no-op.
 */
export function siblingReorderPatches(
  items: readonly SortableCategory[],
  id: string,
  direction: 'up' | 'down',
): SortOrderPatch[] | null {
  const target = items.find(row => row.id === id);
  if (!target) {
    return null;
  }
  const siblings = sortedSiblings(items, target.parent_id);
  const index = siblings.findIndex(row => row.id === id);
  if (index < 0) {
    return null;
  }
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= siblings.length) {
    return null;
  }
  const a = siblings[index];
  const b = siblings[swapWith];
  if (!a || !b) {
    return null;
  }
  return [
    {id: a.id, sortOrder: b.sort_order},
    {id: b.id, sortOrder: a.sort_order},
  ];
}

/**
 * Move a category to a new index among its siblings (same parent_id).
 * Remaps the existing sibling sort_order values onto the new order.
 */
export function siblingReorderToIndex(
  items: readonly SortableCategory[],
  id: string,
  toIndex: number,
): SortOrderPatch[] | null {
  const target = items.find(row => row.id === id);
  if (!target) {
    return null;
  }
  const siblings = sortedSiblings(items, target.parent_id);
  const fromIndex = siblings.findIndex(row => row.id === id);
  if (fromIndex < 0 || toIndex < 0 || toIndex >= siblings.length) {
    return null;
  }
  if (fromIndex === toIndex) {
    return null;
  }
  const next = siblings.slice();
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) {
    return null;
  }
  next.splice(toIndex, 0, moved);
  const orderValues = siblings.map(row => row.sort_order);
  const patches: SortOrderPatch[] = [];
  for (let i = 0; i < next.length; i++) {
    const row = next[i];
    const sortOrder = orderValues[i];
    if (!row || sortOrder === undefined || row.sort_order === sortOrder) {
      continue;
    }
    patches.push({id: row.id, sortOrder});
  }
  return patches.length > 0 ? patches : null;
}

/**
 * Pick the sibling index whose vertical center is closest to the dragged
 * row's center after `translationY`. Layouts must be in sibling sort order.
 */
export function siblingIndexAfterDrag(
  layouts: readonly SiblingLayout[],
  fromIndex: number,
  translationY: number,
): number {
  if (layouts.length === 0) {
    return fromIndex;
  }
  const origin = layouts[fromIndex];
  if (!origin) {
    return fromIndex;
  }
  const dragCenter = origin.y + origin.height / 2 + translationY;
  let bestIndex = fromIndex;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < layouts.length; i++) {
    const layout = layouts[i];
    if (!layout) {
      continue;
    }
    const center = layout.y + layout.height / 2;
    const distance = Math.abs(dragCenter - center);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}

/** Depth-first: parents then their children, preserving sibling sort_order. */
export function flattenCategoryTree<T extends SortableCategory>(
  items: readonly T[],
): T[] {
  const byParent = new Map<string | null, T[]>();
  for (const row of items) {
    const key = row.parent_id;
    const bucket = byParent.get(key) ?? [];
    bucket.push(row);
    byParent.set(key, bucket);
  }
  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.id.localeCompare(b.id);
    });
  }
  const out: T[] = [];
  const visit = (parentId: string | null) => {
    const kids = byParent.get(parentId) ?? [];
    for (const kid of kids) {
      out.push(kid);
      visit(kid.id);
    }
  };
  visit(null);
  return out;
}
