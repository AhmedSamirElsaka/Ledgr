import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Input} from '../../../design/primitives/Input';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {SMS_INBOX_PERIOD_CHOICES} from '../hooks/useSmsInbox';

type Props = {
  periodId: string;
  onPeriodChange: (id: string) => void;
  isCustom: boolean;
  customFrom: string;
  onCustomFromChange: (value: string) => void;
  customTo: string;
  onCustomToChange: (value: string) => void;
  fromError?: string;
  toError?: string;
  periodSummary: string;
  scanning: boolean;
  canImport: boolean;
  onImport: () => void;
};

export function SmsInboxPeriodChips({
  periodId,
  onPeriodChange,
  isCustom,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  fromError,
  toError,
  periodSummary,
  scanning,
  canImport,
  onImport,
}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  const periodLabel = (id: string, days: number): string => {
    if (id === '180') {
      return t('smsInbox.period180');
    }
    return t('smsInbox.periodDays', {count: days});
  };

  return (
    <View style={{gap: theme.space[2]}}>
      <Text variant="label" color="secondary">
        {t('smsInbox.periodLabel')}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.space[2],
        }}>
        {SMS_INBOX_PERIOD_CHOICES.map(option => {
          const selected = option.id === periodId;
          const label = periodLabel(option.id, option.days);
          return (
            <Pressable
              key={option.id}
              accessibilityLabel={t('smsInbox.periodA11y', {label})}
              accessibilityState={{selected}}
              onPress={() => onPeriodChange(option.id)}
              minSize={false}
              style={{
                minHeight: theme.touchTarget,
                paddingHorizontal: theme.space[3],
                justifyContent: 'center',
                borderRadius: theme.radius.md,
                backgroundColor: selected
                  ? theme.colors.accent.primary
                  : theme.colors.surface.sunken,
                borderWidth: 1,
                borderColor: selected
                  ? theme.colors.accent.primary
                  : theme.colors.border.subtle,
              }}>
              <Text variant="bodyStrong" color={selected ? 'inverse' : 'primary'}>
                {label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityLabel={t('smsInbox.customPeriodA11y')}
          accessibilityState={{selected: isCustom}}
          onPress={() => onPeriodChange('custom')}
          minSize={false}
          style={{
            minHeight: theme.touchTarget,
            paddingHorizontal: theme.space[3],
            justifyContent: 'center',
            borderRadius: theme.radius.md,
            backgroundColor: isCustom
              ? theme.colors.accent.primary
              : theme.colors.surface.sunken,
            borderWidth: 1,
            borderColor: isCustom
              ? theme.colors.accent.primary
              : theme.colors.border.subtle,
          }}>
          <Text variant="bodyStrong" color={isCustom ? 'inverse' : 'primary'}>
            {t('period.custom')}
          </Text>
        </Pressable>
      </View>
      {isCustom ? (
        <View style={{gap: theme.space[2]}}>
          <Input
            label={t('smsInbox.fromDate')}
            value={customFrom}
            onChangeText={onCustomFromChange}
            placeholder="2026-01-01"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            error={fromError}
          />
          <Input
            label={t('smsInbox.toDate')}
            value={customTo}
            onChangeText={onCustomToChange}
            placeholder="2026-01-31"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            error={toError}
          />
        </View>
      ) : null}
      <Text variant="caption" color="tertiary">
        {periodSummary}
      </Text>
      <Text variant="caption" color="secondary">
        {t('smsInbox.importOptInHint')}
      </Text>
      <Button
        label={scanning ? t('smsInbox.importing') : t('smsInbox.importAction')}
        onPress={() => {
          onImport();
        }}
        disabled={scanning || !canImport}
        fullWidth
      />
    </View>
  );
}
