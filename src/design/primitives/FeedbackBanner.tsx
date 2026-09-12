import {View, type StyleProp, type ViewStyle} from 'react-native';

import {Icon, type IconName} from '../icons/Icon';
import {useTheme} from '../theme/ThemeProvider';

import {Pressable} from './Pressable';
import {Text} from './Text';

export type FeedbackTone = 'info' | 'success' | 'warning' | 'error';

export type FeedbackBannerProps = {
  message: string;
  tone?: FeedbackTone;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  dismissAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const TONE_ICON: Record<FeedbackTone, IconName> = {
  info: 'Info',
  success: 'CircleCheck',
  warning: 'TriangleAlert',
  error: 'CircleAlert',
};

/**
 * Static inline feedback / snackbar — no enter/exit motion.
 * Use for undo, success, and recoverable errors.
 */
export function FeedbackBanner({
  message,
  tone = 'info',
  actionLabel,
  onAction,
  onDismiss,
  dismissAccessibilityLabel = 'Dismiss',
  style,
  testID,
}: FeedbackBannerProps) {
  const {theme} = useTheme();
  const palette = {
    info: {
      background: theme.colors.semantic.infoMuted,
      foreground: theme.colors.semantic.info,
      border: theme.colors.semantic.info,
    },
    success: {
      background: theme.colors.semantic.positiveMuted,
      foreground: theme.colors.semantic.positive,
      border: theme.colors.semantic.positive,
    },
    warning: {
      background: theme.colors.semantic.warningMuted,
      foreground: theme.colors.semantic.warning,
      border: theme.colors.semantic.warning,
    },
    error: {
      background: theme.colors.semantic.negativeMuted,
      foreground: theme.colors.semantic.negative,
      border: theme.colors.semantic.negative,
    },
  }[tone];

  return (
    <View
      testID={testID}
      accessibilityRole={tone === 'error' ? 'alert' : 'summary'}
      accessibilityLiveRegion="polite"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space[3],
          minHeight: theme.touchTarget,
          paddingVertical: theme.space[3],
          paddingHorizontal: theme.space[4],
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.background,
          ...theme.elevation[1],
        },
        style,
      ]}>
      <Icon name={TONE_ICON[tone]} size={20} color={palette.foreground} />
      <Text
        variant="body"
        style={{flex: 1, color: palette.foreground, minWidth: 0}}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityLabel={actionLabel}
          minSize
          style={{
            minHeight: theme.touchTarget,
            paddingHorizontal: theme.space[2],
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text variant="bodyStrong" style={{color: palette.foreground}}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          accessibilityLabel={dismissAccessibilityLabel}
          style={{
            width: theme.touchTarget,
            height: theme.touchTarget,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="X" size={18} color={palette.foreground} />
        </Pressable>
      ) : null}
    </View>
  );
}
