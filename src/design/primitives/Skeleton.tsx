import {View, type ViewStyle} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

export type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: 'sm' | 'md' | 'lg' | 'full';
  style?: ViewStyle;
};

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 'md',
  style,
}: SkeletonProps) {
  const {theme} = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        {
          width,
          height,
          borderRadius: theme.radius[radius === 'full' ? 'full' : radius],
          backgroundColor: theme.colors.surface.sunken,
        },
        style,
      ]}
    />
  );
}
