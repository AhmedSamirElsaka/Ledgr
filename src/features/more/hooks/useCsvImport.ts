import {useState} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';

import {
  CsvImportError,
  importTransactionsCsv,
  previewCsvImport,
  type CsvImportPreview,
} from '../../../db/backup/importCsvService';
import {
  inspectCsv,
  setMappingField,
  validateCsvMapping,
  type CsvColumnMapping,
  type CsvMappableField,
} from '../../../domain/backup/csv';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';

import type {DatabaseRepos} from '../../../db/createRepos';

type CsvImportArgs = {
  repos: DatabaseRepos;
  csvImportText: string;
  setCsvImportText: (value: string) => void;
  setBusy: (busy: boolean) => void;
};

export function useCsvImport({
  repos,
  csvImportText,
  setCsvImportText,
  setBusy,
}: CsvImportArgs) {
  const {t} = useTranslation();
  const [csvPreview, setCsvPreview] = useState<CsvImportPreview | null>(null);
  const [csvMapping, setCsvMapping] = useState<CsvColumnMapping>({});
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappingField, setMappingFieldState] = useState<CsvMappableField | null>(null);

  const mappingValidation = validateCsvMapping(csvMapping);
  const mappingError = (() => {
    if (mappingValidation.ok) {
      return null;
    }
    const labels = mappingValidation.missing.map(field => {
      switch (field) {
        case 'occurredAt':
          return t('backup.csvFieldOccurredAt');
        case 'amountMinor':
          return t('backup.csvFieldAmountMinor');
        default:
          return field;
      }
    });
    return t('backup.csvMappingMissing', {fields: labels.join(', ')});
  })();

  const clearCsvPreview = () => {
    setCsvPreview(null);
    setCsvMapping({});
    setCsvHeaders([]);
    setMappingFieldState(null);
  };

  const onCsvImportTextChange = (value: string) => {
    clearCsvPreview();
    setCsvImportText(value);
  };

  const runCsvPreview = async (mapping: CsvColumnMapping) => {
    if (!csvImportText.trim()) {
      Alert.alert(t('backup.pasteCsvFirst'));
      return;
    }
    setBusy(true);
    try {
      const inspection = inspectCsv(csvImportText);
      const resolvedMapping =
        Object.keys(mapping).length > 0 ? mapping : inspection.guessedMapping;
      const preview = await previewCsvImport(repos, csvImportText, {
        mapping: resolvedMapping,
      });
      setCsvHeaders(inspection.headers);
      setCsvMapping(resolvedMapping);
      setCsvPreview(preview);
      hapticSuccess();
    } catch (error) {
      hapticWarning();
      const message =
        error instanceof CsvImportError || error instanceof Error
          ? error.message
          : String(error);
      Alert.alert(t('backup.csvPreviewFailed'), message);
    } finally {
      setBusy(false);
    }
  };

  const onPreviewCsv = () => {
    runCsvPreview(csvMapping).catch(() => undefined);
  };

  const onRefreshCsvPreview = () => {
    runCsvPreview(csvMapping).catch(() => undefined);
  };

  const onSelectMappingColumn = (columnIndex: number | undefined) => {
    if (!mappingField) {
      return;
    }
    const next = setMappingField(csvMapping, mappingField, columnIndex);
    setCsvMapping(next);
    setMappingFieldState(null);
    runCsvPreview(next).catch(() => undefined);
  };

  const onConfirmCsvImport = async () => {
    if (!csvImportText.trim()) {
      Alert.alert(t('backup.pasteCsvFirst'));
      return;
    }
    if (!validateCsvMapping(csvMapping).ok) {
      Alert.alert(t('backup.csvPreviewFailed'), mappingError ?? '');
      return;
    }
    setBusy(true);
    try {
      const result = await importTransactionsCsv(repos, csvImportText, {
        mapping: csvMapping,
      });
      hapticSuccess();
      Alert.alert(
        t('backup.csvImportComplete'),
        t('backup.csvImportSummary', {
          imported: result.imported,
          empty: result.skippedEmpty,
          duplicates: result.skippedDuplicates,
        }),
      );
      setCsvImportText('');
      clearCsvPreview();
    } catch (error) {
      hapticWarning();
      Alert.alert(
        t('backup.csvImportFailed'),
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setBusy(false);
    }
  };

  return {
    csvPreview,
    csvMapping,
    csvHeaders,
    mappingField,
    mappingError,
    onCsvImportTextChange,
    onPreviewCsv,
    onRefreshCsvPreview,
    onConfirmCsvImport,
    onClearCsvPreview: clearCsvPreview,
    onOpenMappingField: setMappingFieldState,
    onCloseMappingField: () => setMappingFieldState(null),
    onSelectMappingColumn,
  };
}
