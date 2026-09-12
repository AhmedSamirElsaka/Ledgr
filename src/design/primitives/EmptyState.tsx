import type {ReactNode} from 'react';

import {View} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

import {Button} from './Button';
import {Text} from './Text';

export type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: ReactNode;
};

/**
 * Centered empty that teaches — illustration well + title + next step + CTA.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  illustration,
}: EmptyStateProps) {
  const {theme} = useTheme();

  return (
    <View
      accessibilityRole="summary"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.space[6],
        paddingVertical: theme.space[10],
        gap: theme.space[4],
      }}>
      {illustration ?? (
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
          }}
        />
      )}
      <Text variant="title" align="center">
        {title}
      </Text>
      <Text variant="body" color="secondary" align="center">
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}
