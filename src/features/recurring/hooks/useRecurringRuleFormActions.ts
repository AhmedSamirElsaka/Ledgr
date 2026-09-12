import {useState} from 'react';

import {Alert} from 'react-native';

import {RECURRING_REMINDER_DAYS_BEFORE} from '../../../db/recurring/generateDueRecurring';
import {majorToMinor, type CurrencyCode} from '../../../domain/money/Money';
import {i18n} from '../../../i18n';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';
import {
  cancelRecurringReminder,
  scheduleRecurringReminder,
} from '../../../lib/notifications';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {DatabaseRepos} from '../../../db/createRepos';
import type {RecurringRuleType} from '../../../db/repositories/recurringRulesRepository';
import type {RecurringCycle} from '../../../domain/recurring/cycle';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

type ActionArgs = {
  repos: DatabaseRepos;
  navigation: NativeStackNavigationProp<MoreStackParamList>;
  editId: string | undefined;
  name: string;
  amountText: string;
  currency: CurrencyCode;
  type: RecurringRuleType;
  cycle: RecurringCycle;
  customDays: string;
  nextDue: string;
  note: string;
  active: boolean;
  accountId: string | null;
  categoryId: string | null;
};

export function useRecurringRuleFormActions({
  repos,
  navigation,
  editId,
  name,
  amountText,
  currency,
  type,
  cycle,
  customDays,
  nextDue,
  note,
  active,
  accountId,
  categoryId,
}: ActionArgs) {
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const major = Number(amountText);
    if (!name.trim() || !Number.isFinite(major) || major <= 0) {
      hapticWarning();
      Alert.alert(i18n.t('recurringForm.validationNameAmount'));
      return;
    }
    if (!accountId) {
      hapticWarning();
      Alert.alert(i18n.t('recurringForm.validationAccount'));
      return;
    }
    setSaving(true);
    try {
      const amountMinor = majorToMinor(major, currency);
      const nextOccurredAt = new Date(`${nextDue}T12:00:00.000Z`).toISOString();
      const payload = {
        name: name.trim(),
        accountId,
        categoryId,
        amountMinor,
        currency,
        type,
        cycle,
        customDays: cycle === 'custom' ? Number(customDays) || 30 : null,
        nextOccurredAt,
        note: note.trim() || null,
        active,
      };
      const saved = editId
        ? await repos.recurringRules.update(editId, payload)
        : await repos.recurringRules.create(payload);

      if (saved.active === 1) {
        await scheduleRecurringReminder({
          id: saved.id,
          name: saved.name,
          dueAtMs: Date.parse(saved.next_occurred_at),
          daysBefore: RECURRING_REMINDER_DAYS_BEFORE,
        });
      } else {
        await cancelRecurringReminder(saved.id);
      }
      hapticSuccess();
      navigation.goBack();
    } catch (err) {
      hapticWarning();
      Alert.alert(
        i18n.t('common.saveFailed'),
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!editId) {
      return;
    }
    Alert.alert(
      i18n.t('recurringForm.deleteTitle'),
      i18n.t('recurringForm.deleteBody'),
      [
        {text: i18n.t('common.cancel'), style: 'cancel'},
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => {
            repos.recurringRules
              .remove(editId)
              .then(async () => {
                await cancelRecurringReminder(editId);
                hapticSuccess();
                navigation.goBack();
              })
              .catch(() => hapticWarning());
          },
        },
      ],
    );
  };

  return {saving, onSave, onDelete};
}
