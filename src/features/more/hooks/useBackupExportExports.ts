import {Alert} from 'react-native';

import {endOfDay} from 'date-fns';
import {useTranslation} from 'react-i18next';
import {CachesDirectoryPath, writeFile} from 'react-native-fs';

import {
  buildBackupPayload,
  buildHtmlReport,
  exportTransactionsCsv,
} from '../../../db/backup/backupService';
import {periodRange} from '../../../domain/period/periodRange';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';

import {shareBackupFile} from './backupExportShare';

import type {DatabaseRepos} from '../../../db/createRepos';
import type {PeriodFilter} from '../../../store/uiStore';

type ExportArgs = {
  repos: DatabaseRepos;
  period: PeriodFilter;
  customFrom: string;
  customTo: string;
  setBusy: (busy: boolean) => void;
};

export function useBackupExportExports({
  repos,
  period,
  customFrom,
  customTo,
  setBusy,
}: ExportArgs) {
  const {t} = useTranslation();

  const onExportCsv = async () => {
    setBusy(true);
    try {
      const csv = await exportTransactionsCsv(repos.db);
      const path = `${CachesDirectoryPath}/transactions.csv`;
      await writeFile(path, csv, 'utf8');
      await shareBackupFile(path, 'text/csv', 'transactions.csv');
      hapticSuccess();
    } catch (err) {
      hapticWarning();
      Alert.alert(
        t('backup.exportFailed'),
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setBusy(false);
    }
  };

  const onExportJson = async () => {
    setBusy(true);
    try {
      const payload = await buildBackupPayload(repos.db);
      const path = `${CachesDirectoryPath}/ledgr-backup.json`;
      await writeFile(path, JSON.stringify(payload, null, 2), 'utf8');
      await shareBackupFile(path, 'application/json', 'ledgr-backup.json');
      hapticSuccess();
    } catch (err) {
      hapticWarning();
      Alert.alert(
        t('backup.backupFailed'),
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setBusy(false);
    }
  };

  const onExportHtml = async () => {
    setBusy(true);
    try {
      const range = periodRange(period, new Date(), {
        fromIso: customFrom,
        toIso: customTo,
      });
      const fromIso = range?.fromIso ?? '1970-01-01T00:00:00.000Z';
      const toIso = range?.toIso ?? endOfDay(new Date()).toISOString();
      const base = (await repos.settings.get('base_currency')) ?? 'EGP';
      const [ie, cats] = await Promise.all([
        repos.analytics.incomeVsExpense(fromIso, toIso),
        repos.analytics.categoryBreakdown(fromIso, toIso),
      ]);
      const html = buildHtmlReport({
        title: t('backup.reportTitle'),
        baseCurrency: base,
        periodLabel: period,
        expenseMinor: ie.expenseMinor,
        incomeMinor: ie.incomeMinor,
        topCategories: cats.slice(0, 8).map(c => ({
          name: c.categoryName,
          totalMinor: c.totalMinor,
        })),
      });
      const path = `${CachesDirectoryPath}/report.html`;
      await writeFile(path, html, 'utf8');
      await shareBackupFile(path, 'text/html', 'report.html');
      hapticSuccess();
    } catch (err) {
      hapticWarning();
      Alert.alert(
        t('backup.reportFailed'),
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setBusy(false);
    }
  };

  return {onExportCsv, onExportJson, onExportHtml};
}
