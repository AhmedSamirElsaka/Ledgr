import {useEffect, useRef, type ReactNode} from 'react';

import {Animated, type StyleProp, type ViewStyle} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

type ScreenEnterProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** When true, also fade-slide up slightly. */
  slide?: boolean;
};

/** Calm screen enter — respects ThemeProvider.reduceMotion via duration(). */
export function ScreenEnter({children, style, slide = true}: ScreenEnterProps) {
  const {theme, duration} = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slide ? 8 : 0)).current;

  useEffect(() => {
    const ms = duration(theme.motion.duration.normal);
    if (ms === 0) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ms,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ms,
        useNativeDriver: true,
      }),
    ]).start();
  }, [duration, opacity, theme.motion.duration.normal, translateY]);

  return (
    <Animated.View
      style={[{flex: 1, opacity, transform: [{translateY}]}, style]}>
      {children}
    </Animated.View>
  );
}
