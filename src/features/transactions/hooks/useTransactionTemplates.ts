import {useCallback, useState} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';

import {minorToMajor, isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';
import {
  deleteTransactionTemplate,
  listTransactionTemplates,
  saveTransactionTemplate,
  type TransactionTemplate,
  type TransactionTemplateType,
} from '../../../lib/transactionTemplates';

import type {TransactionType} from '../../../db/repositories/transactionsRepository';

type TemplateFormSlice = {
  type: TransactionType;
  amountMinor: number;
  setAmountText: (value: string) => void;
  setType: (value: TransactionType) => void;
  setAccountId: (value: string | null) => void;
  setCategoryId: (value: string | null) => void;
  setNote: (value: string) => void;
  setStep: (value: 'amount' | 'details') => void;
  accountId: string | null;
  categoryId: string | null;
  note: string;
  currency: CurrencyCode;
};

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

function suggestTemplateName(
  note: string,
  amountMinor: number,
  currency: CurrencyCode,
  fallback: (amount: number) => string,
): string {
  const trimmed = note.trim();
  if (trimmed.length > 0) {
    return trimmed.slice(0, 40);
  }
  return fallback(minorToMajor(amountMinor, currency));
}

export function useTransactionTemplates(form: TemplateFormSlice) {
  const {t} = useTranslation();
  const [templates, setTemplates] = useState<TransactionTemplate[]>(() =>
    listTransactionTemplates(),
  );

  const refresh = useCallback(() => {
    setTemplates(listTransactionTemplates());
  }, []);

  const onApply = useCallback(
    (template: TransactionTemplate) => {
      const currency = asCurrency(template.currency);
      form.setType(template.type);
      form.setAccountId(template.accountId);
      form.setCategoryId(template.categoryId);
      form.setNote(template.note);
      form.setAmountText(String(minorToMajor(template.amountMinor, currency)));
      form.setStep('details');
      hapticSuccess();
    },
    [form],
  );

  const onSaveCurrent = useCallback(() => {
    if (form.type === 'transfer' || form.amountMinor <= 0) {
      hapticWarning();
      Alert.alert(t('templates.saveBlockedTitle'), t('templates.saveBlockedBody'));
      return;
    }
    const name = suggestTemplateName(
      form.note,
      form.amountMinor,
      form.currency,
      amount => t('templates.defaultName', {amount}),
    );
    Alert.alert(t('templates.nameTitle'), t('templates.nameConfirm', {name}), [
      {text: t('common.cancel'), style: 'cancel'},
      {
        text: t('common.save'),
        onPress: () => {
          try {
            saveTransactionTemplate({
              name,
              type: form.type as TransactionTemplateType,
              amountMinor: form.amountMinor,
              currency: form.currency,
              accountId: form.accountId,
              categoryId: form.categoryId,
              note: form.note,
            });
            refresh();
            hapticSuccess();
          } catch {
            hapticWarning();
            Alert.alert(t('templates.saveFailed'));
          }
        },
      },
    ]);
  }, [form, refresh, t]);

  const onDelete = useCallback(
    (id: string) => {
      deleteTransactionTemplate(id);
      refresh();
      hapticSuccess();
    },
    [refresh],
  );

  return {
    templates,
    canSave: form.type !== 'transfer' && form.amountMinor > 0,
    onApply,
    onSaveCurrent,
    onDelete,
  };
}
