import {useCallback, useEffect, useState} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';
import {CachesDirectoryPath, writeFile} from 'react-native-fs';

import {useRepos} from '../../../db/DatabaseProvider';
import {subscribeDbChanges} from '../../../db/events';
import {isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';
import {periodRange} from '../../../domain/period/periodRange';
import {formatDate} from '../../../i18n/formatDate';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';
import {shareLocalFile} from '../../../lib/shareLocalFile';
import {buildMonthInReviewHtml} from '../monthInReviewHtml';

import {asAnalyticsCurrency} from './analyticsScreenUtils';

import type {
  CategorySlice,
  IncomeExpense,
  LargestTx,
  MerchantSlice,
  StreakStats,
  AmountStats,
} from '../../../db/repositories/analyticsRepository';

export type MonthInReviewData = {
  base: CurrencyCode;
  monthLabel: string;
  ie: IncomeExpense;
  stats: AmountStats;
  categories: CategorySlice[];
  merchants: MerchantSlice[];
  largest: LargestTx[];
  streaks: StreakStats;
  empty: boolean;
};

type LoadState = 'loading' | 'ready' | 'error';

export function useMonthInReview() {
  const {t} = useTranslation();
  const repos = useRepos();
  const [data, setData] = useState<MonthInReviewData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [sharing, setSharing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const baseCur = (await repos.settings.get('base_currency')) ?? 'EGP';
      const base = asAnalyticsCurrency(baseCur);
      const range = periodRange('month', new Date());
      if (!range) {
        setLoadState('error');
        return;
      }
      const {fromIso, toIso} = range;
      const [ie, stats, categories, merchants, largest, streaks] =
        await Promise.all([
          repos.analytics.incomeVsExpense(fromIso, toIso),
          repos.analytics.amountStats(fromIso, toIso),
          repos.analytics.categoryBreakdown(fromIso, toIso),
          repos.analytics.topMerchants(fromIso, toIso),
          repos.analytics.largestTransactions(fromIso, toIso, 1),
          repos.analytics.streakStats(),
        ]);
      const monthLabel = formatDate(new Date(fromIso), 'MMMM yyyy');
      setData({
        base,
        monthLabel,
        ie,
        stats,
        categories,
        merchants,
        largest,
        streaks,
        empty: stats.count === 0 && ie.incomeMinor === 0,
      });
      setLoadState('ready');
    } catch {
      setLoadState(prev => (prev === 'ready' ? 'ready' : 'error'));
    }
  }, [repos]);

  useEffect(() => {
    refresh().catch(() => undefined);
    return subscribeDbChanges(event => {
      if (
        event.table === 'transactions' ||
        event.table === 'categories' ||
        event.table === 'budgets'
      ) {
        refresh().catch(() => undefined);
      }
    });
  }, [refresh]);

  const shareReport = useCallback(async () => {
    if (!data || data.empty) {
      return;
    }
    setSharing(true);
    try {
      const topMerchant = data.merchants[0]?.merchant ?? null;
      const topLargest = data.largest[0];
      const html = buildMonthInReviewHtml({
        title: t('insights.monthReview.reportTitle'),
        monthLabel: data.monthLabel,
        baseCurrency: isCurrencyCode(data.base) ? data.base : 'EGP',
        incomeMinor: data.ie.incomeMinor,
        expenseMinor: data.ie.expenseMinor,
        netMinor: data.ie.incomeMinor - data.ie.expenseMinor,
        expenseCount: data.stats.count,
        topCategories: data.categories.slice(0, 5).map(c => ({
          name: c.categoryName,
          totalMinor: c.totalMinor,
        })),
        topMerchant,
        largestLabel: topLargest
          ? topLargest.merchant ?? topLargest.note ?? topLargest.type
          : null,
        largestMinor: topLargest
          ? Math.abs(topLargest.baseAmountMinor)
          : null,
        streakCurrent: data.streaks.current,
        privacyNote: t('insights.monthReview.privacy'),
        labels: {
          income: t('insights.income'),
          expense: t('insights.expense'),
          net: t('insights.netSummary'),
          expensesCount: t('insights.monthReview.expenseCount'),
          topCategories: t('insights.categoriesTitle'),
          topMerchant: t('insights.monthReview.topMerchant'),
          largest: t('insights.monthReview.largest'),
          streak: t('insights.monthReview.streak'),
          none: t('common.noneYet'),
        },
      });
      const filename = `ledgr-month-review-${formatDate(new Date(), 'yyyy-MM')}.html`;
      const path = `${CachesDirectoryPath}/${filename}`;
      await writeFile(path, html, 'utf8');
      await shareLocalFile(path, 'text/html', filename);
      hapticSuccess();
    } catch (err) {
      hapticWarning();
      Alert.alert(
        t('insights.monthReview.shareFailedTitle'),
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setSharing(false);
    }
  }, [data, t]);

  return {
    data,
    loadState,
    sharing,
    shareReport,
    refresh,
  };
}
