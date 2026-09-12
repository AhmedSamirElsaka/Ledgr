import {useCallback, useEffect, useMemo, useState} from 'react';

import {useRepos} from '../../../db/DatabaseProvider';
import {subscribeTable} from '../../../db/events';
import {toListFilter, type TxFilterState} from '../transactionFilters';

import {loadTransactionTagNames} from './loadTransactionTagNames';
import {
  buildTransactionsLayouts,
  buildTransactionsListItems,
} from './transactionsQueryUtils';
import {PAGE_SIZE} from './transactionsScreenUtils';
import {useTransactionsQueryMeta} from './useTransactionsQueryMeta';

import type {TransactionRow} from '../../../db/repositories/transactionsRepository';

export type {TransactionsListItem} from './transactionsQueryUtils';

export type ScreenLoadState = 'loading' | 'ready' | 'error';

export function useTransactionsQuery(
  filters: TxFilterState,
  searchQuery: string,
) {
  const repos = useRepos();
  const meta = useTransactionsQueryMeta(repos);

  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [tagNamesById, setTagNamesById] = useState<Map<string, string[]>>(
    () => new Map(),
  );
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loadState, setLoadState] = useState<ScreenLoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(
    async (opts?: {soft?: boolean}) => {
      const soft = opts?.soft === true;
      if (soft) {
        setRefreshing(true);
      }
      try {
        const list = await repos.transactions.list(
          toListFilter(filters, searchQuery, limit, meta.baseCurrency),
        );
        const tags = await loadTransactionTagNames(
          repos,
          list.map(tx => tx.id),
        );
        setRows(list);
        setTagNamesById(tags);
        setLoadState('ready');
      } catch {
        setLoadState(prev => (prev === 'ready' ? 'ready' : 'error'));
      } finally {
        if (soft) {
          setRefreshing(false);
        }
      }
    },
    [repos, filters, searchQuery, limit, meta.baseCurrency],
  );

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [searchQuery, filters]);

  useEffect(() => {
    refresh().catch(() => undefined);
    const unsubTx = subscribeTable('transactions', () => {
      refresh().catch(() => undefined);
    });
    const unsubLinks = subscribeTable('transaction_tags', () => {
      refresh().catch(() => undefined);
    });
    return () => {
      unsubTx();
      unsubLinks();
    };
  }, [refresh]);

  const items = useMemo(() => buildTransactionsListItems(rows), [rows]);
  const layouts = useMemo(() => buildTransactionsLayouts(items), [items]);

  const onEndReached = useCallback(() => {
    if (rows.length >= limit) {
      setLimit(prev => prev + PAGE_SIZE);
    }
  }, [limit, rows.length]);

  const onRefresh = useCallback(() => {
    refresh({soft: true}).catch(() => undefined);
  }, [refresh]);

  const onRetry = useCallback(() => {
    setLoadState('loading');
    refresh().catch(() => undefined);
  }, [refresh]);

  return {
    rows,
    tagNamesById,
    tags: meta.tags,
    accounts: meta.accounts,
    categories: meta.categories,
    baseCurrency: meta.baseCurrency,
    items,
    layouts,
    onEndReached,
    loadState,
    refreshing,
    onRefresh,
    onRetry,
  };
}
