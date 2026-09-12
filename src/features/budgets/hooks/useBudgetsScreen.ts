import {useCallback, useEffect, useState} from 'react';

import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {subscribeTable} from '../../../db/events';
import {
  computeBudgetProgress,
  getBudgetPeriodBounds,
  periodBoundsToIso,
} from '../../../domain/budgets/period';

import type {BudgetRow} from '../../../db/repositories/budgetsRepository';

export type BudgetListItem = {
  budget: BudgetRow;
  spentMinor: number;
  remainingMinor: number;
  progress: number;
  overBudget: boolean;
  categoryName: string;
};

type ScreenLoadState = 'loading' | 'ready' | 'error';

export function useBudgetsScreen() {
  const {t} = useTranslation();
  const repos = useRepos();
  const [items, setItems] = useState<BudgetListItem[]>([]);
  const [loadState, setLoadState] = useState<ScreenLoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(
    async (opts?: {soft?: boolean}) => {
      const soft = opts?.soft === true;
      if (soft) {
        setRefreshing(true);
      }
      try {
        const budgets = await repos.budgets.listActive();
        const categories = await repos.categories.listActive();
        const nameById = new Map(categories.map(c => [c.id, c.name]));
        const next: BudgetListItem[] = [];
        for (const budget of budgets) {
          const bounds = getBudgetPeriodBounds(
            budget.period,
            budget.start_date,
            budget.end_date,
          );
          const {startIso, endIso} = periodBoundsToIso(bounds);
          const spentMinor = await repos.budgets.sumSpentInPeriod(
            budget.category_id,
            startIso,
            endIso,
          );
          const {remainingMinor, progress, overBudget} = computeBudgetProgress({
            amountMinor: budget.amount_minor,
            spentMinor,
            previousRemainingMinor: 0,
            rollover: budget.rollover === 1,
          });
          next.push({
            budget,
            spentMinor,
            remainingMinor,
            progress,
            overBudget,
            categoryName: budget.category_id
              ? (nameById.get(budget.category_id) ?? t('budgetsScreen.categoryFallback'))
              : t('budgetsScreen.allExpenses'),
          });
        }
        setItems(next);
        setLoadState('ready');
      } catch {
        setLoadState(prev => (prev === 'ready' ? 'ready' : 'error'));
      } finally {
        if (soft) {
          setRefreshing(false);
        }
      }
    },
    [repos, t],
  );

  useEffect(() => {
    refresh().catch(() => undefined);
    const unsubs = [
      subscribeTable('budgets', () => {
        refresh().catch(() => undefined);
      }),
      subscribeTable('transactions', () => {
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

  return {items, loadState, refreshing, onRefresh, onRetry};
}
