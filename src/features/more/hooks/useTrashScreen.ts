import {useCallback} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {deleteReceiptFiles} from '../../../db/receipts/receiptStorage';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';

import {useMoreRepoList} from './useMoreRepoList';

import type {TransactionRow} from '../../../db/repositories/transactionsRepository';

export const TRASH_WINDOW_DAYS = 30;

const TABLES = ['transactions'] as const;

export function useTrashScreen() {
  const {t} = useTranslation();
  const repos = useRepos();
  const load = useCallback(() => repos.transactions.listDeleted(), [repos]);
  const list = useMoreRepoList<TransactionRow>({load, tables: TABLES});

  const onRestore = (id: string) => {
    repos.transactions
      .restore(id)
      .then(() => {
        hapticSuccess();
      })
      .catch(() => hapticWarning());
  };

  const onPermanentDelete = (id: string) => {
    Alert.alert(t('trashScreen.deleteTitle'), t('trashScreen.deleteBody'), [
      {text: t('common.cancel'), style: 'cancel'},
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          repos.transactions
            .hardDelete(id)
            .then(async result => {
              await deleteReceiptFiles(result.receiptPaths);
              hapticSuccess();
            })
            .catch(() => hapticWarning());
        },
      },
    ]);
  };

  return {
    ...list,
    rows: list.items,
    onRestore,
    onPermanentDelete,
  };
}
