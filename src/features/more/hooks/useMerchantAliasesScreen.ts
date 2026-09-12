import {useCallback} from 'react';

import {useRepos} from '../../../db/DatabaseProvider';

import {useMoreRepoList} from './useMoreRepoList';

import type {MerchantAliasRow} from '../../../db/repositories/merchantAliasesRepository';

const TABLES = ['merchant_aliases'] as const;

export function useMerchantAliasesScreen() {
  const repos = useRepos();
  const load = useCallback(() => repos.merchantAliases.list(), [repos]);
  return useMoreRepoList<MerchantAliasRow>({load, tables: TABLES});
}
