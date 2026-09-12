import type {ReactNode} from 'react';

import {View, type StyleProp, type ViewStyle} from 'react-native';

import {useIsRtl} from '../../i18n/useTextInputAlign';
import {disclosureIconName} from '../icons/disclosure';
import {Icon, type IconName} from '../icons/Icon';
import {useTheme} from '../theme/ThemeProvider';

import {Pressable} from './Pressable';
import {Text} from './Text';

export type ListRowVariant = 'standalone' | 'inset';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Defaults to true when `onPress` is set. */
  showDisclosure?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  /** `inset` for rows inside `ListSection` (no card chrome). */
  variant?: ListRowVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function ListRow({
  title,
  subtitle,
  icon,
  leading,
  trailing,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  showDisclosure = Boolean(onPress),
  destructive = false,
  disabled = false,
  variant = 'standalone',
  style,
  testID,
}: ListRowProps) {
  const {theme} = useTheme();
  const isRtl = useIsRtl();
  const inset = variant === 'inset';

  const content = (
    <>
      {leading ??
        (icon ? (
          <View
            style={{
              width: theme.touchTarget,
              height: theme.touchTarget,
              borderRadius: theme.radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: destructive
                ? theme.colors.semantic.negativeMuted
                : theme.colors.accent.primaryMuted,
            }}>
            <Icon
              name={icon}
              size={20}
              color={
                destructive
                  ? theme.colors.semantic.negative
                  : theme.colors.accent.primary
              }
            />
          </View>
        ) : null)}
      <View style={{flex: 1, gap: theme.space[1], minWidth: 0}}>
        <Text variant="bodyStrong" color={destructive ? 'negative' : 'primary'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showDisclosure ? (
        <Icon
          name={disclosureIconName(isRtl)}
          size={18}
          color={theme.colors.text.tertiary}
          accessibilityLabel={undefined}
        />
      ) : null}
    </>
  );

  const rowStyle: StyleProp<ViewStyle> = [
    {
      minHeight: Math.max(theme.touchTarget + theme.space[4], theme.space[16]),
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space[3],
      paddingHorizontal: inset ? theme.space[5] : theme.space[4],
      paddingVertical: theme.space[4],
      opacity: disabled ? 0.45 : 1,
      ...(inset
        ? {
            backgroundColor: 'transparent',
          }
        : {
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            backgroundColor: theme.colors.surface.raised,
            ...theme.elevation[1],
          }),
    },
    style,
  ];

  if (!onPress && !onLongPress) {
    return (
      <View style={rowStyle} testID={testID} accessibilityState={{disabled}}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{disabled}}
      testID={testID}
      minSize={false}
      style={rowStyle}>
      {content}
    </Pressable>
  );
}
