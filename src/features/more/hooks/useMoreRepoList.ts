import {useCallback, useEffect, useRef, useState} from 'react';

import {subscribeTable, type DbChangeTable} from '../../../db/events';

export type MoreListStatus = 'loading' | 'ready' | 'error';

type UseMoreRepoListOptions<T> = {
  load: () => Promise<T[]>;
  tables: readonly DbChangeTable[];
};

export function useMoreRepoList<T>({load, tables}: UseMoreRepoListOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<MoreListStatus>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const loadRef = useRef(load);
  loadRef.current = load;
  const tablesRef = useRef(tables);
  tablesRef.current = tables;
  const tablesKey = tables.join(',');

  const refresh = useCallback(async (mode: 'initial' | 'pull' | 'retry' | 'event' = 'event') => {
    if (mode === 'pull') {
      setRefreshing(true);
    }
    if (mode === 'initial' || mode === 'retry') {
      setStatus('loading');
      setRefreshError(false);
    }
    try {
      const next = await loadRef.current();
      setItems(next);
      setStatus('ready');
      setRefreshError(false);
    } catch {
      if (mode === 'pull' && itemsRef.current.length > 0) {
        setRefreshError(true);
      } else {
        setStatus('error');
        setRefreshError(false);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh('initial').catch(() => undefined);
    const unsubs = tablesRef.current.map(table =>
      subscribeTable(table, () => {
        refresh('event').catch(() => undefined);
      }),
    );
    return () => unsubs.forEach(u => u());
  }, [refresh, tablesKey]);

  const onRefresh = useCallback(() => {
    refresh('pull').catch(() => undefined);
  }, [refresh]);

  const onRetry = useCallback(() => {
    refresh('retry').catch(() => undefined);
  }, [refresh]);

  const dismissRefreshError = useCallback(() => {
    setRefreshError(false);
  }, []);

  return {
    items,
    status,
    refreshing,
    refreshError,
    onRefresh,
    onRetry,
    dismissRefreshError,
  };
}
