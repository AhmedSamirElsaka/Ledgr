import {useRef, type ReactNode} from 'react';

import {Animated, type StyleProp, type ViewStyle} from 'react-native';

import {Pressable} from '../primitives/Pressable';
import {useTheme} from '../theme/ThemeProvider';

type AnimatedFabProps = {
  onPress: () => void;
  accessibilityLabel: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Primary FAB — press scale respects reduce-motion via ThemeProvider.duration. */
export function AnimatedFab({
  onPress,
  accessibilityLabel,
  children,
  style,
}: AnimatedFabProps) {
  const {theme, duration} = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const size = theme.touchTarget + theme.space[4];

  const animateTo = (to: number) => {
    const ms = duration(theme.motion.duration.fast);
    if (ms === 0) {
      scale.setValue(to);
      return;
    }
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      ...theme.motion.spring.snappy,
    }).start();
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      scaleOnPress={false}
      minSize={false}
      onPress={onPress}
      onPressIn={() => animateTo(0.94)}
      onPressOut={() => animateTo(1)}
      style={style}>
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.accent.primary,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{scale}],
          ...theme.elevation[3],
        }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
