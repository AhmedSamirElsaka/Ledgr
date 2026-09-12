import {useCallback, useMemo, useState} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {
  flattenCategoryTree,
  siblingReorderPatches,
  siblingReorderToIndex,
} from '../../../domain/categories/siblingReorder';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';

import {useMoreRepoList} from './useMoreRepoList';

import type {CategoryRow} from '../../../db/repositories/categoriesRepository';

const TABLES = ['categories'] as const;

export function useCategoriesScreen() {
  const {t} = useTranslation();
  const repos = useRepos();
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const load = useCallback(() => repos.categories.listActive(), [repos]);
  const list = useMoreRepoList<CategoryRow>({load, tables: TABLES});

  const items = useMemo(
    () => flattenCategoryTree(list.items),
    [list.items],
  );

  const applyPatches = useCallback(
    (id: string, patches: {id: string; sortOrder: number}[]) => {
      setReorderingId(id);
      repos.categories
        .applySortOrders(patches)
        .then(() => {
          hapticSuccess();
        })
        .catch(() => {
          hapticWarning();
          setFeedback({
            message: t('categoriesScreen.reorderFailed'),
            tone: 'error',
          });
        })
        .finally(() => setReorderingId(null));
    },
    [repos, t],
  );

  const onArchive = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        t('categoriesScreen.archiveTitle'),
        t('categoriesScreen.archiveBody', {name}),
        [
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: t('common.archive'),
            style: 'destructive',
            onPress: () => {
              repos.categories
                .archive(id)
                .then(() => {
                  hapticSuccess();
                  setFeedback({
                    message: t('categoriesScreen.archiveDone', {name}),
                    tone: 'success',
                  });
                })
                .catch(() => {
                  hapticWarning();
                  setFeedback({
                    message: t('categoriesScreen.archiveFailed'),
                    tone: 'error',
                  });
                });
            },
          },
        ],
      );
    },
    [repos, t],
  );

  const onMove = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const patches = siblingReorderPatches(list.items, id, direction);
      if (!patches) {
        return;
      }
      applyPatches(id, patches);
    },
    [applyPatches, list.items],
  );

  const onReorderToIndex = useCallback(
    (id: string, toIndex: number) => {
      const patches = siblingReorderToIndex(list.items, id, toIndex);
      if (!patches) {
        return;
      }
      applyPatches(id, patches);
    },
    [applyPatches, list.items],
  );

  const canMove = useCallback(
    (id: string, direction: 'up' | 'down') =>
      siblingReorderPatches(list.items, id, direction) != null,
    [list.items],
  );

  const canDrag = useCallback(
    (id: string) => {
      const target = list.items.find(row => row.id === id);
      if (!target) {
        return false;
      }
      return (
        list.items.filter(row => row.parent_id === target.parent_id).length > 1
      );
    },
    [list.items],
  );

  return {
    ...list,
    items,
    feedback,
    dismissFeedback: () => setFeedback(null),
    reorderingId,
    onArchive,
    onMove,
    onReorderToIndex,
    canMove,
    canDrag,
  };
}
