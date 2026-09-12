import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'] as const;

export type NumericKeypadProps = {
  onKey: (key: (typeof KEYS)[number]) => void;
};

export function NumericKeypad({onKey}: NumericKeypadProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.space[2],
        justifyContent: 'space-between',
      }}>
      {KEYS.map(key => (
        <Pressable
          key={key}
          accessibilityLabel={
            key === '⌫'
              ? t('add.keypadDeleteA11y')
              : t('add.keypadKeyA11y', {key})
          }
          scaleOnPress
          onPress={() => onKey(key)}
          style={({pressed}) => ({
            width: '31%',
            minHeight: 62,
            borderRadius: theme.radius.lg,
            backgroundColor: pressed
              ? theme.colors.accent.primaryMuted
              : theme.colors.surface.raised,
            borderWidth: 1,
            borderColor: pressed
              ? theme.colors.border.focus
              : theme.colors.border.subtle,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.elevation[1],
          })}>
          <Text variant="headline">{key}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Append keypad input into a major-unit string (e.g. "12.50"). */
export function applyKeypadDigit(
  current: string,
  key: (typeof KEYS)[number],
  maxDecimals: number,
): string {
  if (key === '⌫') {
    return current.slice(0, -1);
  }
  if (key === '.') {
    if (maxDecimals === 0 || current.includes('.')) {
      return current;
    }
    return current.length === 0 ? '0.' : `${current}.`;
  }
  if (current === '0') {
    return key;
  }
  const parts = current.split('.');
  const frac = parts[1] ?? '';
  if (parts.length > 1 && frac.length >= maxDecimals) {
    return current;
  }
  if (parts.length === 1 && current.replace(/^-/, '').length >= 10) {
    return current;
  }
  return `${current}${key}`;
}
