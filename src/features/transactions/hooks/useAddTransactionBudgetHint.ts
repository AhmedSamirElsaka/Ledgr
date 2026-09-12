import {useEffect, useState} from 'react';

import {useTranslation} from 'react-i18next';

import {
  computeBudgetProgress,
  getBudgetPeriodBounds,
  periodBoundsToIso,
} from '../../../domain/budgets/period';
import {formatMoney, money} from '../../../domain/money/Money';

import {asCurrency} from './addTransactionUtils';

import type {DatabaseRepos} from '../../../db/createRepos';
import type {TransactionType} from '../../../db/repositories/transactionsRepository';

export type BudgetHint = {text: string; overBudget: boolean} | null;

export function useAddTransactionBudgetHint(
  repos: DatabaseRepos,
  type: TransactionType,
  categoryId: string | null,
): BudgetHint {
  const {t} = useTranslation();
  const [budgetHint, setBudgetHint] = useState<BudgetHint>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (type !== 'expense' || !categoryId) {
        setBudgetHint(null);
        return;
      }
      const budget = await repos.budgets.findActiveForCategory(categoryId);
      if (!budget || cancelled) {
        setBudgetHint(null);
        return;
      }
      const bounds = getBudgetPeriodBounds(
        budget.period,
        budget.start_date,
        budget.end_date,
      );
      const {startIso, endIso} = periodBoundsToIso(bounds);
      const spent = await repos.budgets.sumSpentInPeriod(categoryId, startIso, endIso);
      const {remainingMinor, overBudget} = computeBudgetProgress({
        amountMinor: budget.amount_minor,
        spentMinor: spent,
        previousRemainingMinor: 0,
        rollover: budget.rollover === 1,
      });
      if (cancelled) {
        return;
      }
      const cur = asCurrency(budget.currency);
      const amount = formatMoney(money(Math.abs(remainingMinor), cur));
      setBudgetHint({
        overBudget,
        text: overBudget
          ? t('add.overBudget', {amount})
          : t('add.budgetRemaining', {amount}),
      });
    })().catch(() => setBudgetHint(null));
    return () => {
      cancelled = true;
    };
  }, [categoryId, repos, t, type]);

  return budgetHint;
}
