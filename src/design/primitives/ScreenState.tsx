import type {ReactNode} from 'react';

import {View, type StyleProp, type ViewStyle} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

import {EmptyState, type EmptyStateProps} from './EmptyState';
import {ErrorState, type ErrorStateProps} from './ErrorState';
import {Skeleton} from './Skeleton';

export type ScreenStatus = 'loading' | 'error' | 'empty' | 'ready';

export type ScreenStateProps = {
  status: ScreenStatus;
  children: ReactNode;
  /** Override the default skeleton stack while loading. */
  loading?: ReactNode;
  empty?: EmptyStateProps;
  error?: ErrorStateProps;
  style?: StyleProp<ViewStyle>;
};

/** Default calm loading shell — composes Skeleton; no decorative motion. */
export function LoadingShell({style}: {style?: StyleProp<ViewStyle>}) {
  const {theme} = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        {
          gap: theme.space[4],
          paddingVertical: theme.space[2],
        },
        style,
      ]}>
      <Skeleton width="42%" height={theme.space[5]} radius="md" />
      <Skeleton height={theme.space[16]} radius="lg" />
      <Skeleton height={theme.touchTarget + theme.space[4]} radius="lg" />
      <Skeleton height={theme.touchTarget + theme.space[4]} radius="lg" />
      <Skeleton width="70%" height={theme.space[4]} radius="md" />
    </View>
  );
}

/**
 * Status shell for list/form screens: loading → Skeleton, error → ErrorState,
 * empty → EmptyState, ready → children. Does not reinvent state UIs.
 */
export function ScreenState({
  status,
  children,
  loading,
  empty,
  error,
  style,
}: ScreenStateProps): ReactNode {
  if (status === 'loading') {
    return (
      <View style={style}>{loading ?? <LoadingShell />}</View>
    );
  }

  if (status === 'error') {
    return (
      <View style={style}>
        <ErrorState
          message={error?.message ?? 'Something went wrong'}
          title={error?.title}
          onRetry={error?.onRetry}
          retryLabel={error?.retryLabel}
        />
      </View>
    );
  }

  if (status === 'empty') {
    if (!empty) {
      return null;
    }
    return (
      <View style={style}>
        <EmptyState {...empty} />
      </View>
    );
  }

  if (style) {
    return <View style={style}>{children}</View>;
  }
  return children;
}
