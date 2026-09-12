import {View} from 'react-native';

import {Icon, type IconName} from '../icons/Icon';
import {useTheme} from '../theme/ThemeProvider';

import {Pressable} from './Pressable';

export type IconButtonProps = {
  name: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  tone?: 'default' | 'accent' | 'danger';
  testID?: string;
};

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  disabled = false,
  tone = 'default',
  testID,
}: IconButtonProps) {
  const {theme} = useTheme();

  const color =
    tone === 'accent'
      ? theme.colors.accent.primary
      : tone === 'danger'
        ? theme.colors.semantic.negative
        : theme.colors.text.primary;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({pressed}) => ({
        width: theme.touchTarget,
        height: theme.touchTarget,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.md,
        backgroundColor: pressed ? theme.colors.surface.sunken : 'transparent',
        opacity: disabled ? 0.4 : 1,
      })}>
      <View>
        <Icon name={name} color={color} />
      </View>
    </Pressable>
  );
}
