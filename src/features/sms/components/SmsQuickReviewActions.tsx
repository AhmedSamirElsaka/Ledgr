import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

type Props = {
  saving: boolean;
  canTrack: boolean;
  canSave: boolean;
  hasCategory: boolean;
  isTransfer: boolean;
  onTrack: () => void;
  onSave: () => void;
  onSnooze: () => void;
  onIgnore: () => void;
};

export function SmsQuickReviewActions({
  saving,
  canTrack,
  canSave,
  hasCategory,
  isTransfer,
  onTrack,
  onSave,
  onSnooze,
  onIgnore,
}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  const useSave = hasCategory && !isTransfer;
  const primaryDisabled = saving || (useSave ? !canSave : !canTrack);

  return (
    <View style={{gap: theme.space[2]}}>
      <Button
        label={
          saving
            ? t('common.saving')
            : useSave
              ? t('smsReview.trackWithCategory')
              : t('smsReview.track')
        }
        onPress={() => {
          if (useSave) {
            onSave();
          } else {
            onTrack();
          }
        }}
        disabled={primaryDisabled}
        fullWidth
      />
      <View style={{flexDirection: 'row', gap: theme.space[2]}}>
        <View style={{flex: 1}}>
          <Button
            label={t('smsReview.snooze')}
            variant="secondary"
            onPress={onSnooze}
            disabled={saving}
            fullWidth
          />
        </View>
        <View style={{flex: 1}}>
          <Button
            label={t('smsReview.ignore')}
            variant="ghost"
            onPress={onIgnore}
            disabled={saving}
            fullWidth
          />
        </View>
      </View>
      <Text variant="caption" color="tertiary" style={{textAlign: 'center'}}>
        {t('smsReview.popupPrivacy')}
      </Text>
    </View>
  );
}
