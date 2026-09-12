import {TextInput, View, type TextInputProps, type ViewStyle} from 'react-native';

import {useTextInputAlign} from '../../i18n/useTextInputAlign';
import {useTheme} from '../theme/ThemeProvider';

import {Text} from './Text';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  /** Border-only invalid state when the message lives on a parent FormSection. */
  invalid?: boolean;
  /** When false, suppress the caption under the field (FormSection owns copy). */
  showErrorMessage?: boolean;
  containerStyle?: ViewStyle;
};

export function Input({
  label,
  error,
  invalid = false,
  showErrorMessage = true,
  containerStyle,
  style,
  editable = true,
  ...rest
}: InputProps) {
  const {theme} = useTheme();
  const align = useTextInputAlign();
  const isInvalid = Boolean(error) || invalid;
  const message = showErrorMessage ? error : undefined;

  return (
    <View style={[{gap: theme.space[2]}, containerStyle]}>
      {label ? (
        <Text variant="label" color="tertiary">
          {label}
        </Text>
      ) : null}
      <TextInput
        editable={editable}
        placeholderTextColor={theme.colors.text.tertiary}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        accessibilityState={{disabled: !editable}}
        style={[
          {
            minHeight: theme.touchTarget,
            borderWidth: 1,
            borderColor: isInvalid
              ? theme.colors.semantic.negative
              : theme.colors.border.subtle,
            backgroundColor: theme.colors.surface.raised,
            borderRadius: theme.radius.lg,
            paddingHorizontal: theme.space[4],
            paddingVertical: theme.space[3],
            color: theme.colors.text.primary,
            fontSize: theme.typography.body.fontSize,
            fontFamily: theme.fontFamily.sans,
            textAlign: align,
            opacity: editable ? 1 : 0.6,
          },
          style,
        ]}
        {...rest}
      />
      {message ? (
        <Text
          variant="caption"
          color="negative"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
