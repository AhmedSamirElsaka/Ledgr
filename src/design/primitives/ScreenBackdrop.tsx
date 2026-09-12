import type {ReactNode} from 'react';

import {View, type StyleProp, type ViewStyle} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import {useTheme} from '../theme/ThemeProvider';

type ScreenBackdropProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Height of the top atmospheric wash. */
  washHeight?: number;
  testID?: string;
};

/** Soft dual-tone wash behind screen content — calm atmosphere, not a flat fill. */
export function ScreenBackdrop({
  children,
  style,
  washHeight = 280,
  testID,
}: ScreenBackdropProps) {
  const {theme} = useTheme();

  return (
    <View
      testID={testID}
      style={[{flex: 1, backgroundColor: theme.colors.bg.app}, style]}>
      <LinearGradient
        colors={[theme.colors.bg.mist, theme.colors.bg.subtle, theme.colors.bg.app]}
        locations={[0, 0.45, 1]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: washHeight,
        }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
