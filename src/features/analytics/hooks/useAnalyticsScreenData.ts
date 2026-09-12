import {useCallback, useEffect, useState} from 'react';

import {useIsFocused} from '@react-navigation/native';

import {useRepos} from '../../../db/DatabaseProvider';
import {subscribeDbChanges} from '../../../db/events';
import {useUiStore} from '../../../store/uiStore';

import {asAnalyticsCurrency, resolveAnalyticsRange} from './analyticsScreenUtils';

import type {
  AccountBalanceHistory,
  BudgetAdherenceSeries,
  CategorySlice,
  CashFlowPoint,
  DowTodPoint,
  IncomeExpense,
  LargestTx,
  MerchantSlice,
  RecurringApprox,
  SpendPoint,
  StreakStats,
  AmountStats,
} from '../../../db/repositories/analyticsRepository';
import type {CurrencyCode} from '../../../domain/money/Money';

type ScreenLoadState = 'loading' | 'ready' | 'error';

const EMPTY_RECURRING: RecurringApprox = {
  recurringMinor: 0,
  oneOffMinor: 0,
  method: 'empty',
};

export function useAnalyticsScreenData() {
  const repos = useRepos();
  const isFocused = useIsFocused();
  const period = useUiStore(s => s.period);
  const customFrom = useUiStore(s => s.customFrom);
  const customTo = useUiStore(s => s.customTo);

  const [base, setBase] = useState<CurrencyCode>('EGP');
  const [spend, setSpend] = useState<SpendPoint[]>([]);
  const [categories, setCategories] = useState<CategorySlice[]>([]);
  const [merchants, setMerchants] = useState<MerchantSlice[]>([]);
  const [ie, setIe] = useState<IncomeExpense>({incomeMinor: 0, expenseMinor: 0});
  const [cashFlow, setCashFlow] = useState<CashFlowPoint[]>([]);
  const [dow, setDow] = useState<DowTodPoint[]>([]);
  const [tod, setTod] = useState<DowTodPoint[]>([]);
  const [stats, setStats] = useState<AmountStats>({avgMinor: 0, medianMinor: 0, count: 0});
  const [largest, setLargest] = useState<LargestTx[]>([]);
  const [recurring, setRecurring] = useState<RecurringApprox>(EMPTY_RECURRING);
  const [streaks, setStreaks] = useState<StreakStats>({
    current: 0,
    longest: 0,
    activeDays: 0,
  });
  const [balanceHistory, setBalanceHistory] = useState<AccountBalanceHistory[]>([]);
  const [budgetAdherence, setBudgetAdherence] = useState<BudgetAdherenceSeries[]>([]);
  const [loadState, setLoadState] = useState<ScreenLoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(
    async (opts?: {soft?: boolean}) => {
      const soft = opts?.soft === true;
      if (soft) {
        setRefreshing(true);
      }
      try {
        const baseCur = (await repos.settings.get('base_currency')) ?? 'EGP';
        setBase(asAnalyticsCurrency(baseCur));
        const {fromIso, toIso} = resolveAnalyticsRange(period, customFrom, customTo);
        const bucket =
          period === 'year' || period === '90d' || period === 'all' ? 'month' : 'day';
        const [
          spendPts,
          cats,
          merch,
          incomeExpense,
          cf,
          dowPts,
          todPts,
          amountStats,
          large,
          rec,
          streak,
          balances,
          adherence,
        ] = await Promise.all([
          repos.analytics.spendOverTime(fromIso, toIso, bucket),
          repos.analytics.categoryBreakdown(fromIso, toIso),
          repos.analytics.topMerchants(fromIso, toIso),
          repos.analytics.incomeVsExpense(fromIso, toIso),
          repos.analytics.cashFlow(fromIso, toIso),
          repos.analytics.dayOfWeekPattern(fromIso, toIso),
          repos.analytics.timeOfDayPattern(fromIso, toIso),
          repos.analytics.amountStats(fromIso, toIso),
          repos.analytics.largestTransactions(fromIso, toIso),
          repos.analytics.recurringVsOneOff(fromIso, toIso),
          repos.analytics.streakStats(),
          repos.analytics.accountBalanceHistory(fromIso, toIso),
          repos.analytics.budgetAdherenceHistory(fromIso, toIso),
        ]);
        setSpend(spendPts);
        setCategories(cats);
        setMerchants(merch);
        setIe(incomeExpense);
        setCashFlow(cf);
        setDow(dowPts);
        setTod(todPts);
        setStats(amountStats);
        setLargest(large);
        setRecurring(rec);
        setStreaks(streak);
        setBalanceHistory(balances);
        setBudgetAdherence(adherence);
        setLoadState('ready');
      } catch {
        setLoadState(prev => (prev === 'ready' ? 'ready' : 'error'));
      } finally {
        if (soft) {
          setRefreshing(false);
        }
      }
    },
    [customFrom, customTo, period, repos],
  );

  useEffect(() => {
    if (!isFocused) {
      return;
    }
    refresh().catch(() => undefined);
    return subscribeDbChanges(event => {
      if (
        event.table === 'transactions' ||
        event.table === 'budgets' ||
        event.table === 'categories' ||
        event.table === 'accounts'
      ) {
        refresh().catch(() => undefined);
      }
    });
  }, [isFocused, refresh]);

  const onRefresh = useCallback(() => {
    refresh({soft: true}).catch(() => undefined);
  }, [refresh]);

  const onRetry = useCallback(() => {
    setLoadState('loading');
    refresh().catch(() => undefined);
  }, [refresh]);

  return {
    base,
    spend,
    categories,
    merchants,
    ie,
    cashFlow,
    dow,
    tod,
    stats,
    largest,
    recurring,
    streaks,
    balanceHistory,
    budgetAdherence,
    loadState,
    refreshing,
    onRefresh,
    onRetry,
  };
}
