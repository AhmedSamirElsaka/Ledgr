import {useEffect, useRef} from 'react';

import {Animated, View} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

type AnimatedProgressBarProps = {
  progress: number;
  overBudget?: boolean;
  accessibilityLabel?: string;
};

/** Budget fill bar — width animates unless reduce-motion. */
export function AnimatedProgressBar({
  progress,
  overBudget = false,
  accessibilityLabel,
}: AnimatedProgressBarProps) {
  const {theme, duration} = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const width = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    const ms = duration(theme.motion.duration.normal);
    if (ms === 0) {
      width.setValue(clamped);
      return;
    }
    Animated.timing(width, {
      toValue: clamped,
      duration: ms,
      useNativeDriver: false,
    }).start();
  }, [clamped, duration, theme.motion.duration.normal, width]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{min: 0, max: 100, now: Math.round(clamped * 100)}}
      style={{
        height: 8,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surface.sunken,
        overflow: 'hidden',
      }}>
      <Animated.View
        style={{
          height: '100%',
          width: width.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
          borderRadius: theme.radius.full,
          backgroundColor: overBudget
            ? theme.colors.semantic.negative
            : theme.colors.accent.primary,
        }}
      />
    </View>
  );
}
