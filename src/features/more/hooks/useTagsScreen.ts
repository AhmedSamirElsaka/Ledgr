import {useCallback} from 'react';

import {useRepos} from '../../../db/DatabaseProvider';

import {useMoreRepoList} from './useMoreRepoList';

import type {TagRow} from '../../../db/repositories/tagsRepository';

const TABLES = ['tags'] as const;

export function useTagsScreen() {
  const repos = useRepos();
  const load = useCallback(() => repos.tags.list(), [repos]);
  return useMoreRepoList<TagRow>({load, tables: TABLES});
}
