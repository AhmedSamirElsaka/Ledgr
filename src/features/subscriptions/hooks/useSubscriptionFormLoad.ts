import {useEffect, useState} from 'react';

import {
  type CurrencyCode,
} from '../../../domain/money/Money';

import {
  asSubscriptionCurrency,
  majorAmountFromMinor,
} from './subscriptionFormUtils';

import type {DatabaseRepos} from '../../../db/createRepos';
import type {SubscriptionCycle} from '../../../domain/subscriptions/cycle';

export function useSubscriptionFormLoad(
  repos: DatabaseRepos,
  editId: string | undefined,
) {
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('EGP');
  const [cycle, setCycle] = useState<SubscriptionCycle>('monthly');
  const [customDays, setCustomDays] = useState('30');
  const [reminderDays, setReminderDays] = useState('3');
  const [nextDue, setNextDue] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    (async () => {
      const base = (await repos.settings.get('base_currency')) ?? 'EGP';
      setCurrency(asSubscriptionCurrency(base));
      if (!editId) {
        return;
      }
      const row = await repos.subscriptions.getById(editId);
      if (!row) {
        return;
      }
      setName(row.name);
      setCurrency(asSubscriptionCurrency(row.currency));
      setCycle(row.cycle);
      setCustomDays(String(row.custom_days ?? 30));
      setReminderDays(String(row.reminder_days_before));
      setNextDue(row.next_due_date.slice(0, 10));
      setAmountText(
        majorAmountFromMinor(row.amount_minor, asSubscriptionCurrency(row.currency)),
      );
    })().catch(() => undefined);
  }, [editId, repos]);

  return {
    name,
    setName,
    amountText,
    setAmountText,
    currency,
    cycle,
    setCycle,
    customDays,
    setCustomDays,
    reminderDays,
    setReminderDays,
    nextDue,
    setNextDue,
  };
}
