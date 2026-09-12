import type {CategoriesRepository, CategoryKind} from '../repositories/categoriesRepository';

const PUBLIC_EXPENSE_NAMES = ['Other', 'General', 'Public'] as const;
const PUBLIC_INCOME_NAMES = ['Other income', 'Other', 'General'] as const;

function isLeaf(
  categoryId: string,
  categories: readonly {id: string; parent_id: string | null}[],
): boolean {
  return !categories.some(other => other.parent_id === categoryId);
}

/**
 * Shared catch-all category for one-tap "Track" (Other / General).
 * Creates "Other" if the seed category was removed.
 */
export async function resolvePublicCategoryId(
  categories: Pick<CategoriesRepository, 'listActive' | 'create'>,
  kind: CategoryKind,
): Promise<string> {
  const rows = await categories.listActive(kind);
  const leaves = rows.filter(row => isLeaf(row.id, rows));
  const names = kind === 'income' ? PUBLIC_INCOME_NAMES : PUBLIC_EXPENSE_NAMES;

  for (const name of names) {
    const hit = leaves.find(row => row.name.toLowerCase() === name.toLowerCase());
    if (hit) {
      return hit.id;
    }
  }

  const created = await categories.create({
    name: kind === 'income' ? 'Other income' : 'Other',
    icon: kind === 'income' ? 'PlusCircle' : 'Ellipsis',
    color: kind === 'income' ? '#1B7F5A' : '#A3B0B5',
    kind,
    sortOrder: 999,
  });
  return created.id;
}
