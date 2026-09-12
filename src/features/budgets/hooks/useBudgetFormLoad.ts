import {useEffect, useState} from 'react';

import {type CurrencyCode} from '../../../domain/money/Money';

import {
  asBudgetCurrency,
  majorAmountFromMinor,
} from './budgetFormUtils';

import type {DatabaseRepos} from '../../../db/createRepos';
import type {BudgetPeriod} from '../../../db/repositories/budgetsRepository';
import type {CategoryRow} from '../../../db/repositories/categoriesRepository';

export function useBudgetFormLoad(repos: DatabaseRepos, editId: string | undefined) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('EGP');
  const [rollover, setRollover] = useState(false);

  useEffect(() => {
    (async () => {
      const base = (await repos.settings.get('base_currency')) ?? 'EGP';
      setCurrency(asBudgetCurrency(base));
      const cats = await repos.categories.listActive('expense');
      setCategories(cats);
      if (editId) {
        const row = await repos.budgets.getById(editId);
        if (!row) {
          return;
        }
        setCategoryId(row.category_id);
        setPeriod(row.period);
        setCurrency(asBudgetCurrency(row.currency));
        setRollover(row.rollover === 1);
        setAmountText(
          majorAmountFromMinor(row.amount_minor, asBudgetCurrency(row.currency)),
        );
      }
    })().catch(() => undefined);
  }, [editId, repos]);

  return {
    categories,
    categoryId,
    setCategoryId,
    period,
    setPeriod,
    amountText,
    setAmountText,
    currency,
    rollover,
    setRollover,
  };
}
