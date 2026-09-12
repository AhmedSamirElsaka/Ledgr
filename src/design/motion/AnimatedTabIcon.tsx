import {Icon, type IconName} from '../icons/Icon';

type TabBarIconProps = {
  name: IconName;
  color: string;
  size: number;
  focused: boolean;
};

/** Tab bar icon without focus scale animation (ThemeProvider.duration → 0 / reduce-motion). */
export function AnimatedTabIcon({name, color, size}: TabBarIconProps) {
  return <Icon name={name} color={color} size={size} />;
}
