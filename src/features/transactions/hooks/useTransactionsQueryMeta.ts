import {useCallback, useEffect, useState} from 'react';

import {subscribeTable} from '../../../db/events';
import {type CurrencyCode} from '../../../domain/money/Money';

import {asCurrency} from './transactionsScreenUtils';

import type {DatabaseRepos} from '../../../db/createRepos';
import type {AccountRow} from '../../../db/repositories/accountsRepository';
import type {CategoryRow} from '../../../db/repositories/categoriesRepository';
import type {TagRow} from '../../../db/repositories/tagsRepository';

export function useTransactionsQueryMeta(repos: DatabaseRepos) {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('EGP');

  const refreshMeta = useCallback(async () => {
    const [tagList, accountList, categoryList, base] = await Promise.all([
      repos.tags.list(),
      repos.accounts.listActive(),
      repos.categories.listActive(),
      repos.settings.get('base_currency'),
    ]);
    setTags(tagList);
    setAccounts(accountList);
    setCategories(categoryList);
    setBaseCurrency(asCurrency(base ?? 'EGP'));
  }, [repos]);

  useEffect(() => {
    refreshMeta().catch(() => undefined);
    const unsubs = [
      subscribeTable('tags', () => {
        refreshMeta().catch(() => undefined);
      }),
      subscribeTable('accounts', () => {
        refreshMeta().catch(() => undefined);
      }),
      subscribeTable('categories', () => {
        refreshMeta().catch(() => undefined);
      }),
      subscribeTable('settings', () => {
        refreshMeta().catch(() => undefined);
      }),
    ];
    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }, [refreshMeta]);

  return {tags, accounts, categories, baseCurrency};
}
