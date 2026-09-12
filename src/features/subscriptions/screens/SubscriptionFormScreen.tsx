import {ScrollView, View} from 'react-native';

import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Button} from '../../../design/primitives/Button';
import {Input} from '../../../design/primitives/Input';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {useSubscriptionFormScreen} from '../hooks/useSubscriptionFormScreen';

import type {SubscriptionCycle} from '../../../domain/subscriptions/cycle';

function cycleLabel(cycle: SubscriptionCycle, t: (key: string) => string): string {
  if (cycle === 'monthly') {
    return t('subscriptionForm.cycleMonthly');
  }
  if (cycle === 'yearly') {
    return t('subscriptionForm.cycleYearly');
  }
  return t('subscriptionForm.cycleCustom');
}

export function SubscriptionFormScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const {
    editId,
    name,
    setName,
    amountText,
    setAmountText,
    cycle,
    setCycle,
    customDays,
    setCustomDays,
    reminderDays,
    setReminderDays,
    nextDue,
    setNextDue,
    onSave,
    onCancel,
    cycles,
  } = useSubscriptionFormScreen();

  return (
    <ScreenBackdrop washHeight={220}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          padding: theme.space[4],
          paddingBottom: insets.bottom + theme.space[8],
          gap: theme.space[3],
        }}
        keyboardShouldPersistTaps="handled">
        <Input label={t('subscriptionForm.name')} value={name} onChangeText={setName} />
        <Input
          label={t('subscriptionForm.amount')}
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
        />
        <Text variant="label" color="tertiary">
          {t('subscriptionForm.cycle')}
        </Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
          {cycles.map(c => (
            <Button
              key={c}
              label={cycleLabel(c, t)}
              variant={cycle === c ? 'primary' : 'secondary'}
              onPress={() => setCycle(c)}
            />
          ))}
        </View>
        {cycle === 'custom' ? (
          <Input
            label={t('subscriptionForm.customDays')}
            value={customDays}
            onChangeText={setCustomDays}
            keyboardType="number-pad"
          />
        ) : null}
        <Input
          label={t('subscriptionForm.nextDue')}
          value={nextDue}
          onChangeText={setNextDue}
        />
        <Input
          label={t('subscriptionForm.remindDays')}
          value={reminderDays}
          onChangeText={setReminderDays}
          keyboardType="number-pad"
        />
        <Button
          label={t('common.save')}
          onPress={() => {
            onSave().catch(() => undefined);
          }}
          fullWidth
        />
        {editId ? (
          <Button
            label={t('subscriptionForm.cancel')}
            variant="secondary"
            onPress={onCancel}
            fullWidth
          />
        ) : null}
      </ScrollView>
    </ScreenBackdrop>
  );
}
