import {Alert} from 'react-native';

import {rejectSmsTransaction} from '../../../db/sms/rejectSmsTransaction';
import {hapticWarning} from '../../../lib/haptics';

import {publishUndoDelete} from './undoDeleteBanner';

import type {RejectSmsRepos} from '../../../db/sms/rejectSmsTransaction';
import type {TFunction} from 'i18next';

/**
 * Reject SMS-sourced transaction. Prefer skipConfirm + undo banner.
 * Alert only when the user may also want “ignore similar”.
 */
export function confirmRejectSmsTransaction(
  repos: RejectSmsRepos,
  transactionId: string,
  t: TFunction,
  options?: {onDone?: () => void; skipConfirm?: boolean},
): void {
  if (options?.skipConfirm) {
    runReject(repos, transactionId, false, t, options.onDone);
    return;
  }

  Alert.alert(t('activity.rejectTitle'), t('activity.rejectBody'), [
    {text: t('common.cancel'), style: 'cancel'},
    {
      text: t('activity.rejectOnly'),
      onPress: () => {
        runReject(repos, transactionId, false, t, options?.onDone);
      },
    },
    {
      text: t('activity.rejectIgnoreSimilar'),
      style: 'destructive',
      onPress: () => {
        runReject(repos, transactionId, true, t, options?.onDone);
      },
    },
  ]);
}

function runReject(
  repos: RejectSmsRepos,
  transactionId: string,
  ignoreSimilar: boolean,
  t: TFunction,
  onDone?: () => void,
): void {
  hapticWarning();
  rejectSmsTransaction(repos, transactionId, {ignoreSimilar})
    .then(() => {
      publishUndoDelete([transactionId]);
      onDone?.();
    })
    .catch(err => {
      Alert.alert(
        t('activity.rejectFailed'),
        err instanceof Error ? err.message : String(err),
      );
    });
}
