import {ScrollView} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Pressable} from '../../../design/primitives/Pressable';
import {Sheet} from '../../../design/primitives/Sheet';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

export type CsvColumnPickerSheetProps = {
  visible: boolean;
  fieldLabel: string;
  headers: string[];
  selectedIndex: number | undefined;
  onSelect: (columnIndex: number | undefined) => void;
  onClose: () => void;
};

export function CsvColumnPickerSheet({
  visible,
  fieldLabel,
  headers,
  selectedIndex,
  onSelect,
  onClose,
}: CsvColumnPickerSheetProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  return (
    <Sheet
      visible={visible}
      title={t('backup.csvMapField', {field: fieldLabel})}
      onClose={onClose}>
      <ScrollView
        style={{maxHeight: 420}}
        contentContainerStyle={{gap: theme.space[2]}}>
        <Pressable
          onPress={() => onSelect(undefined)}
          accessibilityState={{selected: selectedIndex === undefined}}
          style={{
            padding: theme.space[3],
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface.sunken,
            borderWidth: 1,
            borderColor:
              selectedIndex === undefined
                ? theme.colors.accent.primary
                : theme.colors.border.subtle,
          }}>
          <Text variant="body">{t('backup.csvColumnUnmapped')}</Text>
        </Pressable>
        {headers.map((header, index) => {
          const selected = selectedIndex === index;
          const label = header.trim() || t('backup.csvColumnEmpty', {index: index + 1});
          return (
            <Pressable
              key={`${index}-${header}`}
              onPress={() => onSelect(index)}
              accessibilityState={{selected}}
              style={{
                padding: theme.space[3],
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface.sunken,
                borderWidth: 1,
                borderColor: selected
                  ? theme.colors.accent.primary
                  : theme.colors.border.subtle,
              }}>
              <Text variant="bodyStrong">{label}</Text>
              <Text variant="caption" color="secondary">
                {t('backup.csvColumnIndex', {index: index + 1})}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}
