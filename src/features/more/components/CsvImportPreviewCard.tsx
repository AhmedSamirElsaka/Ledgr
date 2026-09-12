import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Amount} from '../../../design/primitives/Amount';
import {Button} from '../../../design/primitives/Button';
import {Card} from '../../../design/primitives/Card';
import {ListRow} from '../../../design/primitives/ListRow';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  CSV_MAPPABLE_FIELDS,
  CSV_REQUIRED_FIELDS,
  type CsvColumnMapping,
  type CsvMappableField,
} from '../../../domain/backup/csv';
import {isCurrencyCode, money} from '../../../domain/money/Money';

import type {CsvImportPreview} from '../../../db/backup/importCsvService';

export type CsvImportPreviewCardProps = {
  preview: CsvImportPreview;
  mapping: CsvColumnMapping;
  headers: string[];
  mappingError: string | null;
  busy: boolean;
  onMapField: (field: CsvMappableField) => void;
  onRefreshPreview: () => void;
  onConfirmImport: () => void;
  onClear: () => void;
};

function fieldLabelKey(field: CsvMappableField): string {
  switch (field) {
    case 'occurredAt':
      return 'backup.csvFieldOccurredAt';
    case 'type':
      return 'backup.csvFieldType';
    case 'amountMinor':
      return 'backup.csvFieldAmountMinor';
    case 'baseAmountMinor':
      return 'backup.csvFieldBaseAmountMinor';
    case 'currency':
      return 'backup.csvFieldCurrency';
    case 'merchant':
      return 'backup.csvFieldMerchant';
    case 'note':
      return 'backup.csvFieldNote';
    case 'accountId':
      return 'backup.csvFieldAccountId';
    case 'categoryId':
      return 'backup.csvFieldCategoryId';
    case 'id':
      return 'backup.csvFieldId';
  }
}

export function CsvImportPreviewCard({
  preview,
  mapping,
  headers,
  mappingError,
  busy,
  onMapField,
  onRefreshPreview,
  onConfirmImport,
  onClear,
}: CsvImportPreviewCardProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const required = new Set<CsvMappableField>(CSV_REQUIRED_FIELDS);

  return (
    <Card style={{gap: theme.space[3]}}>
      <Text variant="bodyStrong">{t('backup.csvPreviewTitle')}</Text>
      <Text variant="caption" color="secondary">
        {t('backup.csvPreviewCounts', {
          rows: preview.dataRowCount,
          ready: preview.readyCount,
          empty: preview.skippedEmpty,
          duplicates: preview.skippedDuplicates,
        })}
      </Text>

      <View style={{gap: theme.space[1]}}>
        <Text variant="label" color="tertiary">
          {t('backup.csvMappingTitle')}
        </Text>
        {CSV_MAPPABLE_FIELDS.map(field => {
          const index = mapping[field];
          const header =
            index !== undefined
              ? headers[index]?.trim() || t('backup.csvColumnEmpty', {index: index + 1})
              : t('backup.csvColumnUnmapped');
          const title = t(fieldLabelKey(field));
          return (
            <ListRow
              key={field}
              variant="inset"
              title={required.has(field) ? `${title} *` : title}
              subtitle={header}
              onPress={() => onMapField(field)}
              accessibilityHint={t('backup.csvMapFieldHint')}
            />
          );
        })}
      </View>

      {mappingError ? (
        <Text variant="caption" color="negative" accessibilityRole="alert">
          {mappingError}
        </Text>
      ) : null}

      {preview.sample.length > 0 ? (
        <View style={{gap: theme.space[2]}}>
          <Text variant="label" color="tertiary">
            {t('backup.csvSampleTitle')}
          </Text>
          {preview.sample.map(row => {
            const currency = isCurrencyCode(row.currency) ? row.currency : 'EGP';
            return (
              <View
                key={row.rowNumber}
                style={{
                  gap: theme.space[1],
                  padding: theme.space[3],
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface.sunken,
                }}>
                <Text variant="caption" color="secondary">
                  {t('backup.csvSampleRow', {
                    row: row.rowNumber,
                    status: t(`backup.csvStatus.${row.status}`),
                  })}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: theme.space[3],
                  }}>
                  <Text variant="body" style={{flex: 1}} numberOfLines={1}>
                    {row.merchant || row.occurredAt}
                  </Text>
                  <Amount value={money(row.amountMinor, currency)} />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      <Button
        label={t('backup.csvRefreshPreview')}
        variant="secondary"
        onPress={onRefreshPreview}
        disabled={busy}
        fullWidth
      />
      <Button
        label={t('backup.csvConfirmImport')}
        onPress={onConfirmImport}
        disabled={busy || preview.readyCount === 0 || Boolean(mappingError)}
        fullWidth
      />
      <Button
        label={t('backup.csvClearPreview')}
        variant="ghost"
        onPress={onClear}
        disabled={busy}
        fullWidth
      />
    </Card>
  );
}
