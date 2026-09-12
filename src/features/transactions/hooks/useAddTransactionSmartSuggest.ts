import {useCallback, useEffect, useState} from 'react';

import {loadCategoryMemory} from '../../../db/smart/categoryMemoryStore';
import {suggestCategorySmart} from '../../../domain/smart/suggestCategory';

import type {DatabaseRepos} from '../../../db/createRepos';
import type {CategoryRow} from '../../../db/repositories/categoriesRepository';
import type {TransactionType} from '../../../db/repositories/transactionsRepository';
import type {SmartSuggestSource} from '../../../domain/smart/suggestCategory';

export type AddCategorySuggestion = {
  categoryId: string;
  source: SmartSuggestSource;
  hitCount?: number;
};

/**
 * Suggests a category from the note/merchant text while adding a transaction.
 */
export function useAddTransactionSmartSuggest(
  repos: DatabaseRepos,
  input: {
    type: TransactionType;
    note: string;
    categories: CategoryRow[];
    isEditing: boolean;
  },
) {
  const [suggestion, setSuggestion] = useState<AddCategorySuggestion | null>(null);
  const [userLocked, setUserLocked] = useState(false);

  const markUserPickedCategory = useCallback(() => {
    setUserLocked(true);
  }, []);

  useEffect(() => {
    setUserLocked(false);
    setSuggestion(null);
  }, [input.type]);

  useEffect(() => {
    if (input.isEditing || input.type === 'transfer') {
      setSuggestion(null);
      return;
    }
    const note = input.note.trim();
    if (note.length < 2) {
      setSuggestion(null);
      return;
    }

    let cancelled = false;
    const kind = input.type === 'income' ? 'income' : 'expense';
    const timer = setTimeout(() => {
      Promise.all([
        repos.merchantAliases.listMerchantCategoryHistory(note),
        repos.merchantAliases.listRecentMerchantCategories(120),
        loadCategoryMemory(repos.settings),
      ])
        .then(([history, recent, memory]) => {
          if (cancelled) {
            return;
          }
          const next = suggestCategorySmart({
            merchant: note,
            body: note,
            kind,
            history: [...history, ...recent],
            memory,
            catalog: input.categories.map(c => ({id: c.id, name: c.name})),
          });
          if (!next) {
            setSuggestion(null);
            return;
          }
          setSuggestion({
            categoryId: next.categoryId,
            source: next.source,
            hitCount: next.hitCount,
          });
        })
        .catch(() => {
          if (!cancelled) {
            setSuggestion(null);
          }
        });
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [input.categories, input.isEditing, input.note, input.type, repos]);

  return {
    suggestion,
    userLocked,
    markUserPickedCategory,
  };
}
