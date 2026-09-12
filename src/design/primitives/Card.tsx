import type {ReactNode} from 'react';

import {View, type StyleProp, type ViewStyle} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import {useTheme} from '../theme/ThemeProvider';

export type CardVariant = 'default' | 'soft' | 'ghost';

export type CardProps = {
  children: ReactNode;
  elevated?: boolean;
  padded?: boolean;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Card({
  children,
  elevated = false,
  padded = true,
  variant = 'default',
  style,
  testID,
}: CardProps) {
  const {theme} = useTheme();

  const surface =
    variant === 'soft'
      ? theme.colors.surface.sunken
      : variant === 'ghost'
        ? 'transparent'
        : theme.colors.surface.raised;

  const borderWidth = variant === 'ghost' ? 0 : 1;

  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: surface,
          borderRadius: theme.radius.lg,
          borderWidth,
          borderColor: theme.colors.border.subtle,
          padding: padded ? theme.space[4] : 0,
          overflow: 'hidden',
          ...(elevated ? theme.elevation[1] : theme.elevation[0]),
        },
        style,
      ]}>
      {children}
    </View>
  );
}

type HeroCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Money focal panel — teal ledger gradient with soft glow.
 * Use for the single numeric hero on a screen.
 */
export function HeroCard({children, style, testID}: HeroCardProps) {
  const {theme} = useTheme();

  return (
    <View
      testID={testID}
      style={[
        {
          borderRadius: theme.radius.xl,
          overflow: 'hidden',
          ...theme.elevation[2],
          shadowColor: theme.colors.hero.glow,
        },
        style,
      ]}>
      <LinearGradient
        colors={[
          theme.colors.hero.from,
          theme.colors.hero.mid,
          theme.colors.hero.to,
        ]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{
          padding: theme.space[5],
        }}>
        {children}
      </LinearGradient>
    </View>
  );
}
