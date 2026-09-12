import {useCallback, useRef, useState} from 'react';

import {type SwipeableMethods} from 'react-native-gesture-handler/ReanimatedSwipeable';

import {useRepos} from '../../../db/DatabaseProvider';

import {useTransactionsSelectionActions} from './useTransactionsSelectionActions';

export function useTransactionsSelection() {
  const repos = useRepos();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkSheet, setBulkSheet] = useState<'category' | 'tag' | null>(null);
  const openSwipeRef = useRef<SwipeableMethods | null>(null);

  const closeOpenSwipe = useCallback(() => {
    openSwipeRef.current?.close();
    openSwipeRef.current = null;
  }, []);

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setBulkSheet(null);
  }, []);

  const enterSelection = useCallback(
    (id: string) => {
      closeOpenSwipe();
      setSelectionMode(true);
      setSelectedIds(new Set([id]));
    },
    [closeOpenSwipe],
  );

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const actions = useTransactionsSelectionActions({
    repos,
    selectedIds,
    selectionMode,
    exitSelection,
    setBulkSheet,
  });

  const onSwipeableOpen = useCallback((ref: SwipeableMethods) => {
    if (openSwipeRef.current && openSwipeRef.current !== ref) {
      openSwipeRef.current.close();
    }
    openSwipeRef.current = ref;
  }, []);

  return {
    selectionMode,
    selectedIds,
    selectedCount: selectedIds.size,
    bulkSheet,
    setBulkSheet,
    closeOpenSwipe,
    exitSelection,
    enterSelection,
    toggleSelected,
    confirmSoftDelete: actions.confirmSoftDelete,
    bulkRecategorize: actions.bulkRecategorize,
    bulkAddTag: actions.bulkAddTag,
    onSwipeableOpen,
  };
}
