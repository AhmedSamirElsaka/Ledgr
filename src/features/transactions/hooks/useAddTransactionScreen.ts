import {useNavigation, useRoute} from '@react-navigation/native';

import {useAddTransactionForm} from './useAddTransactionForm';
import {useAddTransactionSave} from './useAddTransactionSave';
import {useTransactionTemplates} from './useTransactionTemplates';

import type {HomeStackParamList} from '../../../app/navigation/types';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function useAddTransactionScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'AddTransaction'>>();
  const editId = route.params?.id;

  const form = useAddTransactionForm(editId);
  const save = useAddTransactionSave(
    editId,
    {
      type: form.type,
      amountMinor: form.amountMinor,
      accountId: form.accountId,
      toAccountId: form.toAccountId,
      categoryId: form.categoryId,
      note: form.note,
      occurredAt: form.occurredAt,
      currency: form.currency,
      baseCurrency: form.baseCurrency,
      selectedTagIds: form.selectedTagIds,
      receipt: form.receipt,
    },
    {
      saveAsNew: form.saveAsNew,
      onSavedAsNew: form.clearSaveAsNew,
      source: form.source,
    },
  );
  const templates = useTransactionTemplates({
    type: form.type,
    amountMinor: form.amountMinor,
    setAmountText: form.setAmountText,
    setType: form.setType,
    setAccountId: form.setAccountId,
    setCategoryId: form.setCategoryId,
    setNote: form.setNote,
    setStep: form.setStep,
    accountId: form.accountId,
    categoryId: form.categoryId,
    note: form.note,
    currency: form.currency,
  });

  return {
    navigation,
    editId,
    ...form,
    ...save,
    templates,
  };
}
