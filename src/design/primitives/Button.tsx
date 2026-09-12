import {ActivityIndicator, View, type ViewStyle} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

import {Pressable} from './Pressable';
import {Text} from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  fullWidth?: boolean;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  accessibilityHint,
  fullWidth = false,
  testID,
}: ButtonProps) {
  const {theme} = useTheme();
  const isDisabled = disabled || loading;

  const palette = (() => {
    switch (variant) {
      case 'secondary':
        return {
          bg: theme.colors.surface.sunken,
          bgPressed: theme.colors.bg.subtle,
          text: 'primary' as const,
          border: theme.colors.border.default,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          bgPressed: theme.colors.accent.primaryMuted,
          text: 'accent' as const,
          border: 'transparent',
        };
      case 'danger':
        return {
          bg: theme.colors.semantic.negative,
          bgPressed: theme.colors.semantic.negative,
          text: 'inverse' as const,
          border: 'transparent',
        };
      case 'primary':
      default:
        return {
          bg: theme.colors.accent.primary,
          bgPressed: theme.colors.accent.primaryPressed,
          text: 'inverse' as const,
          border: 'transparent',
        };
    }
  })();

  const paddingVertical = size === 'lg' ? theme.space[4] : theme.space[3];
  const paddingHorizontal = size === 'lg' ? theme.space[6] : theme.space[4];

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{disabled: isDisabled, busy: loading}}
      disabled={isDisabled}
      onPress={onPress}
      testID={testID}
      style={({pressed}) =>
        ({
          backgroundColor: pressed ? palette.bgPressed : palette.bg,
          borderColor: palette.border,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderRadius: theme.radius.lg,
          paddingVertical,
          paddingHorizontal,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          minHeight: theme.touchTarget,
          ...(variant === 'primary' && !isDisabled ? theme.elevation[1] : null),
        }) satisfies ViewStyle
      }>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.space[2]}}>
        {loading ? (
          <ActivityIndicator
            color={
              palette.text === 'inverse'
                ? theme.colors.text.inverse
                : theme.colors.accent.primary
            }
          />
        ) : null}
        <Text
          variant="bodyStrong"
          color={
            variant === 'primary' || variant === 'danger'
              ? 'inverse'
              : variant === 'ghost'
                ? 'accent'
                : 'primary'
          }>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
