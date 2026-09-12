import {useCallback, useMemo, type ReactNode} from 'react';

import {
  Pressable as RNPressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

export type AppPressableProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode | ((state: {pressed: boolean}) => ReactNode);
  style?: StyleProp<ViewStyle> | ((state: {pressed: boolean}) => StyleProp<ViewStyle>);
  /** Kept for call-site compatibility; press scale is disabled. */
  scaleOnPress?: boolean;
  minSize?: boolean;
};

export function Pressable({
  children,
  style,
  scaleOnPress: _scaleOnPress = true,
  minSize = true,
  disabled,
  ...rest
}: AppPressableProps) {
  const {theme} = useTheme();

  const baseStyle = useMemo(
    () =>
      minSize
        ? ({
            minWidth: theme.touchTarget,
            minHeight: theme.touchTarget,
          } satisfies ViewStyle)
        : undefined,
    [minSize, theme.touchTarget],
  );

  const resolveStyle = useCallback(
    (state: {pressed: boolean}) => [
      baseStyle,
      typeof style === 'function' ? style(state) : style,
    ],
    [baseStyle, style],
  );

  return (
    <RNPressable
      accessibilityRole="button"
      disabled={disabled}
      style={resolveStyle}
      {...rest}>
      {state => (typeof children === 'function' ? children(state) : children)}
    </RNPressable>
  );
}
