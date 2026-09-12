import type {ReactNode} from 'react';

import {View, type StyleProp, type ViewStyle} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

import {Text} from './Text';

export type FormSectionProps = {
  title: string;
  description?: string;
  /** Section-level validation message (shown below children). */
  error?: string;
  /** Marks the section as invalid without a message (border cue). */
  invalid?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Labeled form block with optional inline validation.
 * Prefer section `error` when multiple fields share one message; pass
 * `invalid` / `error` on individual `Input`s for field-level feedback.
 */
export function FormSection({
  title,
  description,
  error,
  invalid = false,
  children,
  style,
  testID,
}: FormSectionProps) {
  const {theme} = useTheme();
  const showInvalid = Boolean(error) || invalid;

  return (
    <View
      testID={testID}
      style={[
        {
          gap: theme.space[3],
          paddingVertical: theme.space[2],
        },
        style,
      ]}>
      <View style={{gap: theme.space[1]}}>
        <Text variant="bodyStrong">{title}</Text>
        {description ? (
          <Text variant="caption" color="secondary">
            {description}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          gap: theme.space[3],
          borderRadius: theme.radius.lg,
          borderWidth: showInvalid ? 1 : 0,
          borderColor: showInvalid
            ? theme.colors.semantic.negative
            : 'transparent',
        }}>
        {children}
      </View>
      {error ? (
        <Text
          variant="caption"
          color="negative"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
