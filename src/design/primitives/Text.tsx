import {Text as RNText, type TextProps as RNTextProps, type TextStyle} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

import type {TypographyVariant} from '../tokens/typography';

export type AppTextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'inverse'
    | 'disabled'
    | 'accent'
    | 'positive'
    | 'negative'
    | 'warning';
  tabular?: boolean;
  align?: TextStyle['textAlign'];
};

export function Text({
  variant = 'body',
  color = 'primary',
  tabular = false,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  const {theme} = useTheme();
  const type = theme.typography[variant];

  const colorMap = {
    primary: theme.colors.text.primary,
    secondary: theme.colors.text.secondary,
    tertiary: theme.colors.text.tertiary,
    inverse: theme.colors.text.inverse,
    disabled: theme.colors.text.disabled,
    accent: theme.colors.accent.primary,
    positive: theme.colors.semantic.positive,
    negative: theme.colors.semantic.negative,
    warning: theme.colors.semantic.warning,
  } as const;

  return (
    <RNText
      style={[
        {
          fontFamily: theme.fontFamily.sans,
          fontSize: type.fontSize,
          fontWeight: type.fontWeight,
          letterSpacing: type.letterSpacing,
          color: colorMap[color],
          textAlign: align,
          ...(tabular ? {fontVariant: ['tabular-nums'] as TextStyle['fontVariant']} : null),
        },
        style,
      ]}
      {...rest}>
      {children}
    </RNText>
  );
}
