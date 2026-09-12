import {useState} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';
import {DocumentDirectoryPath, writeFile} from 'react-native-fs';

import {
  buildBackupPayload,
  previewBackup,
  restorePreparedBackup,
} from '../../../db/backup/backupService';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';

import {shareBackupFile} from './backupExportShare';
import {useCsvImport} from './useCsvImport';

import type {DatabaseRepos} from '../../../db/createRepos';
import type {PreparedBackup} from '../../../domain/backup/schema';

type ImportArgs = {
  repos: DatabaseRepos;
  csvImportText: string;
  jsonImportText: string;
  setCsvImportText: (value: string) => void;
  setJsonImportText: (value: string) => void;
  setBusy: (busy: boolean) => void;
};

export function useBackupExportImports({
  repos,
  csvImportText,
  jsonImportText,
  setCsvImportText,
  setJsonImportText,
  setBusy,
}: ImportArgs) {
  const {t} = useTranslation();
  const [preparedBackup, setPreparedBackup] = useState<PreparedBackup | null>(null);
  const csvImport = useCsvImport({
    repos,
    csvImportText,
    setCsvImportText,
    setBusy,
  });

  const onJsonImportTextChange = (value: string) => {
    setPreparedBackup(null);
    setJsonImportText(value);
  };

  const onValidateJson = () => {
    if (!jsonImportText.trim()) {
      Alert.alert(t('backup.pasteFirst'));
      return;
    }

    let raw: unknown;
    try {
      raw = JSON.parse(jsonImportText);
    } catch {
      hapticWarning();
      Alert.alert(t('backup.invalidJson'));
      return;
    }

    const result = previewBackup(raw);
    if (!result.ok) {
      hapticWarning();
      Alert.alert(t('backup.restoreRejected'), result.error);
      return;
    }
    setPreparedBackup(result.prepared);
    hapticSuccess();
  };

  const performRestore = async (prepared: PreparedBackup) => {
    setBusy(true);
    let safetyBackupPath: string | null = null;
    try {
      const current = await buildBackupPayload(repos.db);
      const suffix = new Date().toISOString().replace(/[:.]/g, '-');
      safetyBackupPath = `${DocumentDirectoryPath}/ledgr-pre-restore-${suffix}.json`;
      await writeFile(safetyBackupPath, JSON.stringify(current, null, 2), 'utf8');

      await restorePreparedBackup(repos.db, prepared);
      hapticSuccess();
      setPreparedBackup(null);
      setJsonImportText('');
      Alert.alert(t('backup.restoreComplete'), t('backup.safetyBackupCreated'), [
        {text: t('common.done')},
        {
          text: t('backup.shareSafetyBackup'),
          onPress: () => {
            if (safetyBackupPath) {
              shareBackupFile(safetyBackupPath, 'application/json', 'ledgr-pre-restore.json').catch(
                () => undefined,
              );
            }
          },
        },
      ]);
    } catch (error) {
      hapticWarning();
      Alert.alert(
        t('backup.restoreFailed'),
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setBusy(false);
    }
  };

  const onConfirmRestore = () => {
    if (!preparedBackup) {
      return;
    }
    Alert.alert(t('backup.confirmTitle'), t('backup.confirmBody'), [
      {text: t('common.cancel'), style: 'cancel'},
      {
        text: t('backup.confirmReplace'),
        style: 'destructive',
        onPress: () => {
          performRestore(preparedBackup).catch(() => undefined);
        },
      },
    ]);
  };

  return {
    preparedBackup,
    onJsonImportTextChange,
    onValidateJson,
    onConfirmRestore,
    ...csvImport,
  };
}
