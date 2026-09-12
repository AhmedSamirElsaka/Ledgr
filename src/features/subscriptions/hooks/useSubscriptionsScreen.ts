import {useCallback, useEffect, useState} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {subscribeTable} from '../../../db/events';
import {isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';
import {scheduleSubscriptionReminder} from '../../../lib/notifications';

import type {SubscriptionRow} from '../../../db/repositories/subscriptionsRepository';

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

export function useSubscriptionsScreen() {
  const {t} = useTranslation();
  const repos = useRepos();
  const [items, setItems] = useState<SubscriptionRow[]>([]);
  const [monthly, setMonthly] = useState(0);
  const [yearly, setYearly] = useState(0);
  const [base, setBase] = useState<CurrencyCode>('EGP');
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  const refresh = useCallback(async () => {
    try {
      const baseCur = (await repos.settings.get('base_currency')) ?? 'EGP';
      setBase(asCurrency(baseCur));
      setItems(await repos.subscriptions.listAll());
      const totals = await repos.subscriptions.totalsForActive();
      setMonthly(totals.monthlyMinor);
      setYearly(totals.yearlyMinor);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [repos]);

  useEffect(() => {
    refresh().catch(() => undefined);
    return subscribeTable('subscriptions', () => {
      refresh().catch(() => undefined);
    });
  }, [refresh]);

  const onDetect = async () => {
    const detected = await repos.subscriptions.detectFromHistory();
    if (detected.length === 0) {
      Alert.alert(
        t('subscriptionsScreen.detectNoneTitle'),
        t('subscriptionsScreen.detectNoneBody'),
      );
      return;
    }
    const first = detected[0];
    if (!first) {
      return;
    }
    Alert.alert(
      t('subscriptionsScreen.confirmTitle'),
      t('subscriptionsScreen.confirmBody', {
        merchant: first.merchant,
        amount: first.amountMinor / 100,
        currency: first.currency,
        cycle: first.cycle,
        occurrences: first.occurrences,
      }),
      [
        {text: t('subscriptionsScreen.skip'), style: 'cancel'},
        {
          text: t('common.add'),
          onPress: () => {
            repos.subscriptions
              .create({
                name: first.merchant,
                merchantMatcher: first.merchant,
                amountMinor: first.amountMinor,
                currency: first.currency,
                cycle: first.cycle,
                nextDueDate: new Date().toISOString(),
              })
              .then(async sub => {
                await scheduleSubscriptionReminder({
                  id: sub.id,
                  name: sub.name,
                  dueAtMs: Date.parse(sub.next_due_date),
                  daysBefore: sub.reminder_days_before,
                });
                await refresh();
              })
              .catch(() => undefined);
          },
        },
      ],
    );
  };

  return {items, monthly, yearly, base, loadState, onDetect, onRetry: refresh};
}
