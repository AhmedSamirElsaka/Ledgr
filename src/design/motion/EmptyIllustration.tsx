import {View} from 'react-native';

import {Icon, type IconName} from '../icons/Icon';
import {useTheme} from '../theme/ThemeProvider';

type EmptyIllustrationProps = {
  name: IconName;
  secondaryName?: IconName;
};

/** Large accent blob with optional secondary badge — icon-based empty composition. */
export function EmptyIllustration({name, secondaryName}: EmptyIllustrationProps) {
  const {theme} = useTheme();

  return (
    <View
      accessible={false}
      style={{
        width: 96,
        height: 96,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.accent.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }}>
        <Icon name={name} color={theme.colors.accent.primary} size={36} />
      </View>
      {secondaryName ? (
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 36,
            height: 36,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface.raised,
            borderWidth: 1,
            borderColor: theme.colors.border.default,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.elevation[1],
          }}>
          <Icon name={secondaryName} color={theme.colors.text.secondary} size={18} />
        </View>
      ) : null}
    </View>
  );
}
