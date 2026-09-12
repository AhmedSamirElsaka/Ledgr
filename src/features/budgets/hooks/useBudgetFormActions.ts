import {useState} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';

import {majorToMinor, type CurrencyCode} from '../../../domain/money/Money';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {DatabaseRepos} from '../../../db/createRepos';
import type {BudgetPeriod} from '../../../db/repositories/budgetsRepository';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

type ActionArgs = {
  repos: DatabaseRepos;
  navigation: NativeStackNavigationProp<MoreStackParamList>;
  editId: string | undefined;
  categoryId: string | null;
  period: BudgetPeriod;
  amountText: string;
  currency: CurrencyCode;
  rollover: boolean;
};

export function useBudgetFormActions({
  repos,
  navigation,
  editId,
  categoryId,
  period,
  amountText,
  currency,
  rollover,
}: ActionArgs) {
  const {t} = useTranslation();
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const major = Number(amountText);
    if (!Number.isFinite(major) || major <= 0) {
      hapticWarning();
      Alert.alert(t('budgetForm.amountRequired'));
      return;
    }
    if (!categoryId) {
      hapticWarning();
      Alert.alert(t('budgetForm.categoryRequired'));
      return;
    }
    setSaving(true);
    try {
      const amountMinor = majorToMinor(major, currency);
      if (editId) {
        await repos.budgets.update(editId, {
          categoryId,
          period,
          amountMinor,
          currency,
          rollover,
        });
      } else {
        await repos.budgets.create({
          categoryId,
          period,
          amountMinor,
          currency,
          rollover,
          startDate: new Date().toISOString(),
          endDate: period === 'custom' ? null : null,
        });
      }
      hapticSuccess();
      navigation.goBack();
    } catch (err) {
      hapticWarning();
      Alert.alert(
        t('common.saveFailed'),
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setSaving(false);
    }
  };

  const onDeactivate = () => {
    if (!editId) {
      return;
    }
    repos.budgets
      .deactivate(editId)
      .then(() => {
        hapticSuccess();
        navigation.goBack();
      })
      .catch(() => hapticWarning());
  };

  return {saving, onSave, onDeactivate};
}
