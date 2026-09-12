import {useCallback} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';

import {hapticWarning} from '../../../lib/haptics';

import {confirmRejectSmsTransaction} from './confirmRejectSmsTransaction';
import {publishUndoDelete} from './undoDeleteBanner';

import type {DatabaseRepos} from '../../../db/createRepos';

type ActionArgs = {
  repos: DatabaseRepos;
  selectedIds: Set<string>;
  selectionMode: boolean;
  exitSelection: () => void;
  setBulkSheet: (sheet: 'category' | 'tag' | null) => void;
};

export function useTransactionsSelectionActions({
  repos,
  selectedIds,
  selectionMode,
  exitSelection,
  setBulkSheet,
}: ActionArgs) {
  const {t} = useTranslation();

  const softDeleteWithConfirm = useCallback(
    (deleteIds: string[]) => {
      // Optimistic soft-delete + undo banner — no confirmation dialog.
      hapticWarning();
      repos.transactions
        .softDeleteMany(deleteIds)
        .then(() => {
          publishUndoDelete(deleteIds);
          if (selectionMode) {
            exitSelection();
          }
        })
        .catch(err => {
          Alert.alert(
            t('activity.deleteFailed'),
            err instanceof Error ? err.message : String(err),
          );
        });
    },
    [exitSelection, repos.transactions, selectionMode, t],
  );

  const confirmSoftDelete = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        return;
      }

      if (ids.length === 1) {
        const id = ids[0];
        if (!id) {
          return;
        }
        repos.transactions
          .getById(id)
          .then(tx => {
            if (tx?.source === 'sms') {
              confirmRejectSmsTransaction(repos, tx.id, t, {
                onDone: () => {
                  if (selectionMode) {
                    exitSelection();
                  }
                },
              });
              return;
            }
            softDeleteWithConfirm(ids);
          })
          .catch(() => {
            softDeleteWithConfirm(ids);
          });
        return;
      }

      softDeleteWithConfirm(ids);
    },
    [exitSelection, repos, selectionMode, softDeleteWithConfirm, t],
  );

  const bulkRecategorize = useCallback(
    (categoryId: string) => {
      const ids = [...selectedIds];
      repos.transactions
        .setCategoryMany(ids, categoryId)
        .then(() => {
          setBulkSheet(null);
          exitSelection();
        })
        .catch(err => {
          Alert.alert(
            t('activity.updateFailed'),
            err instanceof Error ? err.message : String(err),
          );
        });
    },
    [exitSelection, repos.transactions, selectedIds, setBulkSheet, t],
  );

  const bulkAddTag = useCallback(
    (tagId: string) => {
      const ids = [...selectedIds];
      repos.tags
        .addTagToMany(ids, tagId)
        .then(() => {
          setBulkSheet(null);
          exitSelection();
        })
        .catch(err => {
          Alert.alert(
            t('activity.tagFailed'),
            err instanceof Error ? err.message : String(err),
          );
        });
    },
    [exitSelection, repos.tags, selectedIds, setBulkSheet, t],
  );

  return {confirmSoftDelete, bulkRecategorize, bulkAddTag};
}
