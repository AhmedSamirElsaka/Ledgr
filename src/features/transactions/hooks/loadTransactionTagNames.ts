import type {DatabaseRepos} from '../../../db/createRepos';

/** Loads tag display names keyed by transaction id (empty array when none). */
export async function loadTransactionTagNames(
  repos: DatabaseRepos,
  transactionIds: readonly string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  const unique = [...new Set(transactionIds)];
  await Promise.all(
    unique.map(async id => {
      const tags = await repos.tags.getTagsForTransaction(id);
      map.set(
        id,
        tags.map(tag => tag.name),
      );
    }),
  );
  return map;
}
