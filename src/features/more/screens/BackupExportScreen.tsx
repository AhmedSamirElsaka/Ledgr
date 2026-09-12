import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Card} from '../../../design/primitives/Card';
import {FormSection} from '../../../design/primitives/FormSection';
import {Input} from '../../../design/primitives/Input';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {CsvColumnPickerSheet} from '../components/CsvColumnPickerSheet';
import {CsvImportPreviewCard} from '../components/CsvImportPreviewCard';
import {MoreStackChrome} from '../components/MoreStackChrome';
import {useBackupExport} from '../hooks/useBackupExport';

function mappingFieldLabel(
  t: (key: string) => string,
  field: string | null,
): string {
  switch (field) {
    case 'occurredAt':
      return t('backup.csvFieldOccurredAt');
    case 'type':
      return t('backup.csvFieldType');
    case 'amountMinor':
      return t('backup.csvFieldAmountMinor');
    case 'baseAmountMinor':
      return t('backup.csvFieldBaseAmountMinor');
    case 'currency':
      return t('backup.csvFieldCurrency');
    case 'merchant':
      return t('backup.csvFieldMerchant');
    case 'note':
      return t('backup.csvFieldNote');
    case 'accountId':
      return t('backup.csvFieldAccountId');
    case 'categoryId':
      return t('backup.csvFieldCategoryId');
    case 'id':
      return t('backup.csvFieldId');
    default:
      return '';
  }
}

export function BackupExportScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {
    busy,
    csvImportText,
    jsonImportText,
    preparedBackup,
    csvPreview,
    csvMapping,
    csvHeaders,
    mappingField,
    mappingError,
    setCsvImportText,
    setJsonImportText,
    onExportCsv,
    onExportJson,
    onExportHtml,
    onValidateJson,
    onConfirmRestore,
    onPreviewCsv,
    onRefreshCsvPreview,
    onConfirmCsvImport,
    onClearCsvPreview,
    onOpenMappingField,
    onCloseMappingField,
    onSelectMappingColumn,
  } = useBackupExport();

  return (
    <MoreStackChrome>
      <Text variant="body" color="secondary">
        {t('backup.body')}
      </Text>

      <FormSection title={t('backup.exportSection')}>
        <Button
          label={t('backup.exportCsv')}
          onPress={() => {
            onExportCsv().catch(() => undefined);
          }}
          disabled={busy}
          fullWidth
        />
        <Button
          label={t('backup.exportJson')}
          variant="secondary"
          onPress={() => {
            onExportJson().catch(() => undefined);
          }}
          disabled={busy}
          fullWidth
        />
        <Button
          label={t('backup.exportHtml')}
          variant="secondary"
          onPress={() => {
            onExportHtml().catch(() => undefined);
          }}
          disabled={busy}
          fullWidth
        />
      </FormSection>

      <FormSection title={t('backup.restoreJson')}>
        <Input
          label={t('backup.pasteJson')}
          value={jsonImportText}
          onChangeText={setJsonImportText}
          multiline
          style={{minHeight: 100}}
        />
        <Button
          label={t('backup.validateRestore')}
          onPress={onValidateJson}
          disabled={busy}
          fullWidth
        />
        {preparedBackup ? (
          <Card style={{gap: theme.space[2]}}>
            <Text variant="bodyStrong">{t('backup.previewTitle')}</Text>
            <Text variant="caption" color="secondary">
              {t('backup.previewMetadata', {
                version: preparedBackup.summary.sourceVersion,
                exportedAt: preparedBackup.summary.exportedAt,
              })}
            </Text>
            <Text variant="body">
              {t('backup.previewCounts', preparedBackup.summary.counts)}
            </Text>
            <Text variant="caption" color="secondary">
              {t('backup.previewTotal', {count: preparedBackup.summary.totalRows})}
            </Text>
            <Button
              label={t('backup.confirmReplace')}
              variant="danger"
              onPress={onConfirmRestore}
              disabled={busy}
              fullWidth
            />
          </Card>
        ) : null}
      </FormSection>

      <FormSection title={t('backup.importCsv')} description={t('backup.importCsvHint')}>
        <Input
          label={t('backup.pasteCsv')}
          value={csvImportText}
          onChangeText={setCsvImportText}
          multiline
          style={{minHeight: 100}}
        />
        {!csvPreview ? (
          <Button
            label={t('backup.csvPreviewAction')}
            variant="secondary"
            onPress={onPreviewCsv}
            disabled={busy}
            fullWidth
          />
        ) : (
          <CsvImportPreviewCard
            preview={csvPreview}
            mapping={csvMapping}
            headers={csvHeaders}
            mappingError={mappingError}
            busy={busy}
            onMapField={onOpenMappingField}
            onRefreshPreview={onRefreshCsvPreview}
            onConfirmImport={() => {
              onConfirmCsvImport().catch(() => undefined);
            }}
            onClear={onClearCsvPreview}
          />
        )}
      </FormSection>

      <CsvColumnPickerSheet
        visible={mappingField != null}
        fieldLabel={mappingFieldLabel(t, mappingField)}
        headers={csvHeaders}
        selectedIndex={mappingField ? csvMapping[mappingField] : undefined}
        onSelect={onSelectMappingColumn}
        onClose={onCloseMappingField}
      />
      <View />
    </MoreStackChrome>
  );
}
