import {useEffect, useState} from 'react';

import {
  asRecurringCurrency,
  majorAmountFromMinor,
} from './recurringFormUtils';

import type {DatabaseRepos} from '../../../db/createRepos';
import type {AccountRow} from '../../../db/repositories/accountsRepository';
import type {CategoryRow} from '../../../db/repositories/categoriesRepository';
import type {RecurringRuleType} from '../../../db/repositories/recurringRulesRepository';
import type {CurrencyCode} from '../../../domain/money/Money';
import type {RecurringCycle} from '../../../domain/recurring/cycle';


export function useRecurringRuleFormLoad(
  repos: DatabaseRepos,
  editId: string | undefined,
) {
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('EGP');
  const [type, setType] = useState<RecurringRuleType>('expense');
  const [cycle, setCycle] = useState<RecurringCycle>('monthly');
  const [customDays, setCustomDays] = useState('30');
  const [nextDue, setNextDue] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [active, setActive] = useState(true);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const base = (await repos.settings.get('base_currency')) ?? 'EGP';
      setCurrency(asRecurringCurrency(base));
      const activeAccounts = await repos.accounts.listActive();
      setAccounts(activeAccounts);
      if (!editId && activeAccounts[0]) {
        setAccountId(activeAccounts[0].id);
      }

      if (!editId) {
        const cats = await repos.categories.listActive('expense');
        setCategories(cats);
        setLoading(false);
        return;
      }

      const row = await repos.recurringRules.getById(editId);
      if (!row) {
        setLoading(false);
        return;
      }
      setName(row.name);
      setCurrency(asRecurringCurrency(row.currency));
      setType(row.type);
      setCycle(row.cycle);
      setCustomDays(String(row.custom_days ?? 30));
      setNextDue(row.next_occurred_at.slice(0, 10));
      setNote(row.note ?? '');
      setActive(row.active === 1);
      setAccountId(row.account_id);
      setCategoryId(row.category_id);
      setAmountText(
        majorAmountFromMinor(row.amount_minor, asRecurringCurrency(row.currency)),
      );
      const cats = await repos.categories.listActive(row.type);
      setCategories(cats);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [editId, repos]);

  useEffect(() => {
    repos.categories
      .listActive(type)
      .then(setCategories)
      .catch(() => undefined);
  }, [repos, type]);

  return {
    loading,
    name,
    setName,
    amountText,
    setAmountText,
    currency,
    type,
    setType,
    cycle,
    setCycle,
    customDays,
    setCustomDays,
    nextDue,
    setNextDue,
    note,
    setNote,
    active,
    setActive,
    accountId,
    setAccountId,
    categoryId,
    setCategoryId,
    accounts,
    categories,
  };
}
