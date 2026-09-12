import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {useTheme} from '../../../design/theme/ThemeProvider';

export type BulkSelectionBarProps = {
  bottomInset: number;
  selectedCount: number;
  onRecategorize: () => void;
  onAddTag: () => void;
  onDelete: () => void;
};

export function BulkSelectionBar({
  bottomInset,
  selectedCount,
  onRecategorize,
  onAddTag,
  onDelete,
}: BulkSelectionBarProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const disabled = selectedCount === 0;

  return (
    <View
      accessible
      accessibilityRole="toolbar"
      accessibilityLabel={t('activity.bulkBarA11y', {count: selectedCount})}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: theme.space[4],
        paddingTop: theme.space[3],
        paddingBottom: bottomInset + theme.space[3],
        backgroundColor: theme.colors.surface.overlay,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.subtle,
        flexDirection: 'row',
        gap: theme.space[2],
        ...theme.elevation[2],
      }}>
      <Button
        label={t('activity.bulkCategory')}
        variant="secondary"
        disabled={disabled}
        onPress={onRecategorize}
      />
      <Button
        label={t('activity.bulkAddTag')}
        variant="secondary"
        disabled={disabled}
        onPress={onAddTag}
      />
      <Button
        label={t('common.delete')}
        variant="danger"
        disabled={disabled}
        onPress={onDelete}
      />
    </View>
  );
}
