import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';

import {majorToMinor, type CurrencyCode} from '../../../domain/money/Money';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';
import {scheduleSubscriptionReminder} from '../../../lib/notifications';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {DatabaseRepos} from '../../../db/createRepos';
import type {SubscriptionCycle} from '../../../domain/subscriptions/cycle';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

type ActionArgs = {
  repos: DatabaseRepos;
  navigation: NativeStackNavigationProp<MoreStackParamList>;
  editId: string | undefined;
  name: string;
  amountText: string;
  currency: CurrencyCode;
  cycle: SubscriptionCycle;
  customDays: string;
  reminderDays: string;
  nextDue: string;
};

export function useSubscriptionFormActions({
  repos,
  navigation,
  editId,
  name,
  amountText,
  currency,
  cycle,
  customDays,
  reminderDays,
  nextDue,
}: ActionArgs) {
  const {t} = useTranslation();

  const onSave = async () => {
    const major = Number(amountText);
    if (!name.trim() || !Number.isFinite(major) || major <= 0) {
      hapticWarning();
      Alert.alert(t('subscriptionForm.validation'));
      return;
    }
    const amountMinor = majorToMinor(major, currency);
    const nextDueDate = new Date(`${nextDue}T12:00:00.000Z`).toISOString();
    const reminderDaysBefore = Number(reminderDays) || 3;
    const payload = {
      name: name.trim(),
      merchantMatcher: name.trim(),
      amountMinor,
      currency,
      cycle,
      customDays: cycle === 'custom' ? Number(customDays) || 30 : null,
      nextDueDate,
      reminderDaysBefore,
    };
    const saved = editId
      ? await repos.subscriptions.update(editId, payload)
      : await repos.subscriptions.create(payload);
    await scheduleSubscriptionReminder({
      id: saved.id,
      name: saved.name,
      dueAtMs: Date.parse(saved.next_due_date),
      daysBefore: saved.reminder_days_before,
    });
    hapticSuccess();
    navigation.goBack();
  };

  const onCancel = () => {
    if (!editId) {
      return;
    }
    repos.subscriptions
      .cancel(editId)
      .then(() => navigation.goBack())
      .catch(() => undefined);
  };

  return {onSave, onCancel};
}
