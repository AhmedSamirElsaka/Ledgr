import {useCallback, useState} from 'react';

import {Alert} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {TransactionMutationError} from '../../../db/repositories/transactionsRepository';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';

import {parseSaveForm, persistTransaction, type SaveFormState} from './addTransactionSaveUtils';
import {confirmRejectSmsTransaction} from './confirmRejectSmsTransaction';
import {publishUndoDelete} from './undoDeleteBanner';

import type {HomeStackParamList} from '../../../app/navigation/types';
import type {TransactionSource} from '../../../db/repositories/transactionsRepository';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {TFunction} from 'i18next';

function mutationErrorMessage(err: unknown, t: TFunction): string {
  if (err instanceof TransactionMutationError) {
    switch (err.code) {
      case 'invalid_fx_rate':
        return t('add.invalidFxRate');
      case 'invalid_transfer_pair':
        if (err.message === 'Pick a destination account.') {
          return t('add.pickDestination');
        }
        if (err.message === 'A transfer amount must be greater than zero.') {
          return t('add.transferAmountZero');
        }
        return t('add.invalidTransferPair');
      case 'transfer_account_change_not_supported':
        return t('add.transferAccountChange');
      case 'transfer_type_change_not_supported':
        return t('add.transferTypeChange');
      default:
        return err.message;
    }
  }
  if (err instanceof Error) {
    if (err.message === 'Transaction not found') {
      return t('add.notFound');
    }
    return err.message;
  }
  return String(err);
}

function validationMessage(raw: string | undefined, t: TFunction): string {
  if (!raw) {
    return t('common.nameRequired');
  }
  if (raw.startsWith('add.')) {
    return t(raw);
  }
  return raw;
}

export function useAddTransactionSave(
  editId: string | undefined,
  form: SaveFormState,
  options?: {
    saveAsNew?: boolean;
    onSavedAsNew?: () => void;
    source?: TransactionSource | null;
  },
) {
  const {t} = useTranslation();
  const repos = useRepos();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const [saving, setSaving] = useState(false);
  const saveAsNew = options?.saveAsNew === true;
  const onSavedAsNew = options?.onSavedAsNew;
  const source = options?.source ?? null;
  const effectiveEditId = saveAsNew ? undefined : editId;

  const onSave = useCallback(async () => {
    const parsed = parseSaveForm(form);
    if (!parsed.success) {
      hapticWarning();
      Alert.alert(
        t('add.cannotSave'),
        validationMessage(parsed.error.issues[0]?.message, t),
      );
      return;
    }

    setSaving(true);
    try {
      await persistTransaction(repos, effectiveEditId, form, parsed.data);
      hapticSuccess();
      onSavedAsNew?.();
      navigation.goBack();
    } catch (err) {
      hapticWarning();
      Alert.alert(t('add.saveFailed'), mutationErrorMessage(err, t));
    } finally {
      setSaving(false);
    }
  }, [effectiveEditId, form, navigation, onSavedAsNew, repos, t]);

  const onDelete = useCallback(() => {
    if (!editId || saveAsNew) {
      return;
    }
    if (source === 'sms') {
      // Soft-delete + undo — no confirm chain (destructive actions are reversible).
      confirmRejectSmsTransaction(repos, editId, t, {
        skipConfirm: true,
        onDone: () => {
          navigation.goBack();
        },
      });
      return;
    }
    repos.transactions
      .softDelete(editId)
      .then(() => {
        hapticSuccess();
        publishUndoDelete([editId]);
        navigation.goBack();
      })
      .catch(err => {
        hapticWarning();
        Alert.alert(t('activity.deleteFailed'), mutationErrorMessage(err, t));
      });
  }, [editId, navigation, repos, saveAsNew, source, t]);

  return {saving, onSave, onDelete, effectiveEditId, isSmsSource: source === 'sms'};
}
