import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {FeedbackBanner} from '../../../design/primitives/FeedbackBanner';
import {FormSection} from '../../../design/primitives/FormSection';
import {Input} from '../../../design/primitives/Input';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {MoreStackChrome} from '../components/MoreStackChrome';
import {useNotificationsSettingsScreen} from '../hooks/useNotificationsSettingsScreen';

export function NotificationsSettingsScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const screen = useNotificationsSettingsScreen();

  return (
    <MoreStackChrome>
      <Text variant="body" color="secondary">
        {t('notifications.privacyBody')}
      </Text>

      {screen.feedback ? (
        <FeedbackBanner
          message={screen.feedback}
          tone="success"
          onDismiss={screen.dismissFeedback}
          dismissAccessibilityLabel={t('common.close')}
        />
      ) : null}

      <FormSection
        title={t('notifications.lockScreenSection')}
        description={t('notifications.lockScreenDescription')}>
        <Button
          label={
            screen.lockScreenDetailsEnabled
              ? t('notifications.lockScreenDetailsEnabled')
              : t('notifications.lockScreenDetailsDisabled')
          }
          variant={screen.lockScreenDetailsEnabled ? 'primary' : 'secondary'}
          disabled={screen.busy}
          onPress={screen.onToggleLockScreenDetails}
          fullWidth
        />
      </FormSection>

      <FormSection
        title={t('notifications.dailySection')}
        description={t('notifications.dailyDescription')}>
        <Button
          label={
            screen.dailyEnabled
              ? t('notifications.dailyEnabled')
              : t('notifications.dailyDisabled')
          }
          variant={screen.dailyEnabled ? 'primary' : 'secondary'}
          disabled={screen.busy}
          onPress={screen.onToggleDaily}
          fullWidth
        />
        <View style={{flexDirection: 'row', gap: theme.space[2]}}>
          <View style={{flex: 1}}>
            <Input
              label={t('notifications.hour')}
              value={screen.hour}
              onChangeText={screen.setHour}
              keyboardType="number-pad"
              editable={!screen.busy}
            />
          </View>
          <View style={{flex: 1}}>
            <Input
              label={t('notifications.minute')}
              value={screen.minute}
              onChangeText={screen.setMinute}
              keyboardType="number-pad"
              editable={!screen.busy}
            />
          </View>
        </View>
        <Button
          label={t('notifications.saveDailyTime')}
          disabled={screen.busy || !screen.dailyEnabled}
          onPress={screen.onSaveDailyTime}
          fullWidth
        />
      </FormSection>

      <FormSection
        title={t('notifications.subscriptionsSection')}
        description={t('notifications.subscriptionsDescription')}>
        <Button
          label={
            screen.subscriptionEnabled
              ? t('notifications.subscriptionsEnabled')
              : t('notifications.subscriptionsDisabled')
          }
          variant={screen.subscriptionEnabled ? 'primary' : 'secondary'}
          disabled={screen.busy}
          onPress={screen.onToggleSubscriptions}
          fullWidth
        />
      </FormSection>

      <FormSection
        title={t('notifications.quietSection')}
        description={t('notifications.quietDescription')}>
        <Button
          label={
            screen.quietEnabled
              ? t('notifications.quietEnabled')
              : t('notifications.quietDisabled')
          }
          variant={screen.quietEnabled ? 'primary' : 'secondary'}
          disabled={screen.busy}
          onPress={screen.onToggleQuiet}
          fullWidth
        />
        <Text variant="label" color="tertiary">
          {t('notifications.quietStart')}
        </Text>
        <View style={{flexDirection: 'row', gap: theme.space[2]}}>
          <View style={{flex: 1}}>
            <Input
              label={t('notifications.hour')}
              value={screen.quietStartHour}
              onChangeText={screen.setQuietStartHour}
              keyboardType="number-pad"
              editable={!screen.busy}
            />
          </View>
          <View style={{flex: 1}}>
            <Input
              label={t('notifications.minute')}
              value={screen.quietStartMinute}
              onChangeText={screen.setQuietStartMinute}
              keyboardType="number-pad"
              editable={!screen.busy}
            />
          </View>
        </View>
        <Text variant="label" color="tertiary">
          {t('notifications.quietEnd')}
        </Text>
        <View style={{flexDirection: 'row', gap: theme.space[2]}}>
          <View style={{flex: 1}}>
            <Input
              label={t('notifications.hour')}
              value={screen.quietEndHour}
              onChangeText={screen.setQuietEndHour}
              keyboardType="number-pad"
              editable={!screen.busy}
            />
          </View>
          <View style={{flex: 1}}>
            <Input
              label={t('notifications.minute')}
              value={screen.quietEndMinute}
              onChangeText={screen.setQuietEndMinute}
              keyboardType="number-pad"
              editable={!screen.busy}
            />
          </View>
        </View>
        <Button
          label={t('notifications.saveQuietHours')}
          disabled={screen.busy || !screen.quietEnabled}
          onPress={screen.onSaveQuietHours}
          fullWidth
        />
      </FormSection>
    </MoreStackChrome>
  );
}
