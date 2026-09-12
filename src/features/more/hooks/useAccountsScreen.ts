import {useCallback, useState} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';

import {useMoreRepoList} from './useMoreRepoList';

import type {AccountWithBalance} from '../../../db/repositories/accountsRepository';

const TABLES = ['accounts', 'transactions'] as const;

export function useAccountsScreen() {
  const {t} = useTranslation();
  const repos = useRepos();
  const [feedback, setFeedback] = useState<string | null>(null);
  const load = useCallback(
    () => repos.accounts.listWithBalances(),
    [repos],
  );
  const list = useMoreRepoList<AccountWithBalance>({load, tables: TABLES});

  const onArchive = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        t('accountsScreen.archiveTitle'),
        t('accountsScreen.archiveBody', {name}),
        [
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: t('common.archive'),
            style: 'destructive',
            onPress: () => {
              repos.accounts
                .archive(id)
                .then(() => {
                  hapticSuccess();
                  setFeedback(t('accountsScreen.archiveDone', {name}));
                })
                .catch(() => {
                  hapticWarning();
                  setFeedback(t('accountsScreen.archiveFailed'));
                });
            },
          },
        ],
      );
    },
    [repos, t],
  );

  return {
    ...list,
    feedback,
    dismissFeedback: () => setFeedback(null),
    onArchive,
  };
}
