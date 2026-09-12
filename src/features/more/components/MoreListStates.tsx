import type {ReactElement} from 'react';

import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {ErrorState} from '../../../design/primitives/ErrorState';
import {FeedbackBanner} from '../../../design/primitives/FeedbackBanner';
import {Skeleton} from '../../../design/primitives/Skeleton';
import {useTheme} from '../../../design/theme/ThemeProvider';

import type {MoreListStatus} from '../hooks/useMoreRepoList';

type MoreListSkeletonProps = {
  rows?: number;
};

export function MoreListSkeleton({rows = 4}: MoreListSkeletonProps) {
  const {theme} = useTheme();
  return (
    <View style={{gap: theme.space[2], paddingVertical: theme.space[2]}}>
      {Array.from({length: rows}, (_, index) => (
        <Skeleton key={index} height={64} radius="lg" />
      ))}
    </View>
  );
}

type MoreListStatusBodyProps = {
  status: MoreListStatus;
  itemCount: number;
  empty: ReactElement | null;
  onRetry: () => void;
};

export function MoreListStatusBody({
  status,
  itemCount,
  empty,
  onRetry,
}: MoreListStatusBodyProps) {
  const {t} = useTranslation();

  if (status === 'loading' && itemCount === 0) {
    return <MoreListSkeleton />;
  }
  if (status === 'error' && itemCount === 0) {
    return (
      <ErrorState
        title={t('common.errorTitle')}
        message={t('common.loadFailed')}
        retryLabel={t('common.retry')}
        onRetry={onRetry}
      />
    );
  }
  if (status === 'ready' && itemCount === 0) {
    return empty;
  }
  return null;
}

type MoreRefreshBannerProps = {
  visible: boolean;
  onRetry: () => void;
  onDismiss: () => void;
};

export function MoreRefreshBanner({
  visible,
  onRetry,
  onDismiss,
}: MoreRefreshBannerProps) {
  const {t} = useTranslation();
  if (!visible) {
    return null;
  }
  return (
    <FeedbackBanner
      tone="warning"
      message={t('common.refreshFailed')}
      actionLabel={t('common.retry')}
      onAction={() => {
        onDismiss();
        onRetry();
      }}
    />
  );
}
