import {useCallback, useEffect, useState} from 'react';

import {endOfDay} from 'date-fns';

import {useRepos} from '../../../db/DatabaseProvider';
import {subscribeTable} from '../../../db/events';
import {isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';
import {periodRange} from '../../../domain/period/periodRange';
import {calcTrackingStreak} from '../../../domain/streaks/streaks';
import {getPrefBoolean} from '../../../lib/prefs';
import {useUiStore} from '../../../store/uiStore';
import {loadTransactionTagNames} from '../../transactions';

import type {AccountWithBalance} from '../../../db/repositories/accountsRepository';
import type {TransactionRow} from '../../../db/repositories/transactionsRepository';

type ScreenLoadState = 'loading' | 'ready' | 'error';

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

export function txSignedMinor(tx: TransactionRow): number {
  if (tx.type === 'expense') {
    return -Math.abs(tx.base_amount_minor);
  }
  if (tx.type === 'income') {
    return Math.abs(tx.base_amount_minor);
  }
  return tx.base_amount_minor;
}

export function useHomeScreen() {
  const repos = useRepos();
  const period = useUiStore(s => s.period);
  const setPeriod = useUiStore(s => s.setPeriod);
  const customFrom = useUiStore(s => s.customFrom);
  const customTo = useUiStore(s => s.customTo);

  const [spendMinor, setSpendMinor] = useState(0);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('EGP');
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [recent, setRecent] = useState<TransactionRow[]>([]);
  const [tagNamesById, setTagNamesById] = useState<Map<string, string[]>>(
    () => new Map(),
  );
  const [streak, setStreak] = useState(0);
  const [showCashPrompt, setShowCashPrompt] = useState(false);
  const [loadState, setLoadState] = useState<ScreenLoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(
    async (opts?: {soft?: boolean}) => {
      const soft = opts?.soft === true;
      if (soft) {
        setRefreshing(true);
      }
      try {
        const base = (await repos.settings.get('base_currency')) ?? 'EGP';
        setBaseCurrency(asCurrency(base));
        const count = await repos.accounts.countActive();
        setShowCashPrompt(
          count === 0 && getPrefBoolean('onboarding.cashPromptDismissed') !== true,
        );

        const range = periodRange(period, new Date(), {
          fromIso: customFrom,
          toIso: customTo,
        });
        const spend = await repos.transactions.sumExpenseBaseInPeriod(
          range?.fromIso ?? '1970-01-01T00:00:00.000Z',
          range?.toIso ?? endOfDay(new Date()).toISOString(),
        );
        setSpendMinor(spend);

        const [accs, txs, dates] = await Promise.all([
          repos.accounts.listWithBalances(),
          repos.transactions.listRecent(8),
          repos.transactions.listOccurredDates(),
        ]);
        const tags = await loadTransactionTagNames(
          repos,
          txs.map(tx => tx.id),
        );
        setAccounts(accs);
        setRecent(txs);
        setTagNamesById(tags);
        setStreak(calcTrackingStreak(dates));
        setLoadState('ready');
      } catch {
        setLoadState(prev => (prev === 'ready' ? 'ready' : 'error'));
      } finally {
        if (soft) {
          setRefreshing(false);
        }
      }
    },
    [period, customFrom, customTo, repos],
  );

  useEffect(() => {
    refresh().catch(() => undefined);
    const unsubs = [
      subscribeTable('transactions', () => {
        refresh().catch(() => undefined);
      }),
      subscribeTable('accounts', () => {
        refresh().catch(() => undefined);
      }),
      subscribeTable('transaction_tags', () => {
        refresh().catch(() => undefined);
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, [refresh]);

  const onRefresh = useCallback(() => {
    refresh({soft: true}).catch(() => undefined);
  }, [refresh]);

  const onRetry = useCallback(() => {
    setLoadState('loading');
    refresh().catch(() => undefined);
  }, [refresh]);

  return {
    period,
    setPeriod,
    spendMinor,
    baseCurrency,
    accounts,
    recent,
    tagNamesById,
    streak,
    showCashPrompt,
    setShowCashPrompt,
    repos,
    loadState,
    refreshing,
    onRefresh,
    onRetry,
  };
}
