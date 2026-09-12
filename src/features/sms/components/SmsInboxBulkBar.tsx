import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

type Props = {
  bottomInset: number;
  selectedCount: number;
  allSelected: boolean;
  tracking: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onTrack: () => void;
  onCancel: () => void;
};

export function SmsInboxBulkBar({
  bottomInset,
  selectedCount,
  allSelected,
  tracking,
  onSelectAll,
  onClear,
  onTrack,
  onCancel,
}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const canTrack = selectedCount > 0 && !tracking;

  return (
    <View
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
        gap: theme.space[2],
        ...theme.elevation[2],
      }}>
      <Text variant="label" color="secondary">
        {t('smsInbox.selectedCount', {count: selectedCount})}
      </Text>
      <Text variant="caption" color="tertiary">
        {t('smsInbox.trackHint')}
      </Text>
      <View style={{flexDirection: 'row', gap: theme.space[2], flexWrap: 'wrap'}}>
        <Button
          label={allSelected ? t('smsInbox.clearSelection') : t('smsInbox.selectAll')}
          variant="secondary"
          onPress={allSelected ? onClear : onSelectAll}
          disabled={tracking}
        />
        <Button
          label={tracking ? t('smsInbox.tracking') : t('smsInbox.track')}
          onPress={onTrack}
          disabled={!canTrack}
        />
        <Button
          label={t('common.cancel')}
          variant="ghost"
          onPress={onCancel}
          disabled={tracking}
        />
      </View>
    </View>
  );
}
