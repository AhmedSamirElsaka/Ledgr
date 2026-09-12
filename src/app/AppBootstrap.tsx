import {useEffect, useState} from 'react';

import {DeviceEventEmitter, NativeEventEmitter, NativeModules, StatusBar, View} from 'react-native';

import {useTranslation} from 'react-i18next';
import {hide as hideBootSplash} from 'react-native-bootsplash';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useDatabase, useRepos} from '../db/DatabaseProvider';
import {ErrorState} from '../design/primitives/ErrorState';
import {Skeleton} from '../design/primitives/Skeleton';
import {Text} from '../design/primitives/Text';
import {useTheme} from '../design/theme/ThemeProvider';
import {AppLockGate} from '../features/lock';
import {OnboardingScreen} from '../features/onboarding';
import {SmsQuickReviewModal} from '../features/sms';
import {syncNotificationPrivacyToNative} from '../lib/notifications';
import {useSmsReviewStore} from '../store/smsReviewStore';

import {RootNavigator} from './RootNavigator';

function DatabaseLoading() {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg.app,
        paddingTop: insets.top + theme.space[8],
        paddingHorizontal: theme.space[4],
        gap: theme.space[3],
      }}>
      <Skeleton height={28} width="40%" />
      <Skeleton height={18} width="70%" />
      <View style={{height: theme.space[4]}} />
      <Skeleton height={120} radius="lg" />
      <Skeleton height={72} radius="lg" />
      <Skeleton height={72} radius="lg" />
      <Text variant="caption" color="tertiary" style={{marginTop: theme.space[4]}}>
        {t('bootstrap.openingDatabase')}
      </Text>
    </View>
  );
}

function ReadyApp() {
  const repos = useRepos();
  const openReview = useSmsReviewStore(s => s.openReview);
  const {t} = useTranslation();
  const {theme} = useTheme();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [bootstrapError, setBootstrapError] = useState<Error | null>(null);
  const [settingsBootId, setSettingsBootId] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setBootstrapError(null);
    setShowOnboarding(null);
    repos.settings
      .get('onboarding.completed')
      .then(value => {
        if (cancelled) {
          return;
        }
        setShowOnboarding(value !== '1');
      })
      .catch(err => {
        if (cancelled) {
          return;
        }
        setBootstrapError(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      cancelled = true;
    };
  }, [repos, settingsBootId]);

  useEffect(() => {
    syncNotificationPrivacyToNative().catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {generateDueRecurring} = await import('../db/recurring/generateDueRecurring');
        if (cancelled) {
          return;
        }
        await generateDueRecurring(repos);
      } catch {
        // Generation is best-effort on open; UI remains usable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repos]);

  useEffect(() => {
    let unsubIncoming: (() => void) | undefined;
    const subs: Array<{remove: () => void}> = [];

    const open = (
      sender: string,
      body: string,
      receivedAtMs: number,
      autoAction?: 'track' | 'ignore' | 'review',
    ) => {
      const maybeIgnoreThenReview = async () => {
        try {
          const {loadIgnoredSimilarPatterns} = await import('../db/sms/ignoredSimilar');
          const {matchesIgnoreSimilar} = await import('../domain/sms/ignoreSimilar');
          const patterns = await loadIgnoredSimilarPatterns(repos.settings);
          if (patterns.length > 0) {
            const {loadSmsPreview, processSmsMessage} = await import('../db/sms/processSms');
            const preview = await loadSmsPreview(repos, {
              sender,
              body,
              receivedAt: new Date(receivedAtMs).toISOString(),
            });
            if (
              matchesIgnoreSimilar(patterns, {
                sender,
                merchant: preview.match?.fields.merchant,
              })
            ) {
              await processSmsMessage(repos, {
                sender,
                body,
                receivedAt: new Date(receivedAtMs).toISOString(),
                deferTransaction: true,
              });
              return;
            }
          }
        } catch {
          // Fall through to review on any ignore-check failure.
        }
        openReview({sender, body, receivedAt: receivedAtMs, autoAction});
      };
      maybeIgnoreThenReview().catch(() => {
        openReview({sender, body, receivedAt: receivedAtMs, autoAction});
      });
    };

    const onReviewEvent = (payload: {
      sender?: string;
      body?: string;
      receivedAt?: number;
      autoAction?: string;
    }) => {
      if (!payload.sender || !payload.body) {
        return;
      }
      const action =
        payload.autoAction === 'track' || payload.autoAction === 'ignore'
          ? payload.autoAction
          : 'review';
      open(
        payload.sender,
        payload.body,
        Number(payload.receivedAt) || Date.now(),
        action,
      );
    };

    const run = async () => {
      const {drainPendingSms, subscribeIncomingSms} = await import('../native/smsReceived');

      const pending = await drainPendingSms();
      for (const sms of pending) {
        open(sms.sender, sms.body, sms.receivedAt);
      }

      unsubIncoming = subscribeIncomingSms(sms => {
        open(sms.sender, sms.body, sms.receivedAt);
      });

      // Notification tap → MainActivity (and native bridge) emit this.
      if (NativeModules.LedgrSmsReceived) {
        const emitter = new NativeEventEmitter(NativeModules.LedgrSmsReceived);
        subs.push(emitter.addListener('LedgrSmsReview', onReviewEvent));
      }
      subs.push(DeviceEventEmitter.addListener('LedgrSmsReview', onReviewEvent));
    };
    run().catch(() => undefined);

    return () => {
      unsubIncoming?.();
      for (const sub of subs) {
        sub.remove();
      }
    };
  }, [openReview, repos]);

  if (bootstrapError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg.app,
          justifyContent: 'center',
        }}>
        <ErrorState
          title={t('bootstrap.settingsUnavailableTitle')}
          message={bootstrapError.message || t('bootstrap.settingsUnavailableBody')}
          onRetry={() => setSettingsBootId(v => v + 1)}
          retryLabel={t('common.retry')}
        />
      </View>
    );
  }

  if (showOnboarding === null) {
    return <DatabaseLoading />;
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={() => {
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <AppLockGate>
      <RootNavigator />
      <SmsQuickReviewModal />
    </AppLockGate>
  );
}

export function AppBootstrap() {
  const {status, error, retry} = useDatabase();
  const {theme} = useTheme();
  const {t} = useTranslation();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }
    hideBootSplash({fade: true}).catch(() => undefined);
  }, [status]);

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.bg.app}}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      {status === 'loading' ? <DatabaseLoading /> : null}
      {status === 'error' ? (
        <View style={{flex: 1, justifyContent: 'center'}}>
          <ErrorState
            title={t('bootstrap.databaseUnavailableTitle')}
            message={error?.message ?? t('bootstrap.databaseUnavailableBody')}
            onRetry={retry}
            retryLabel={t('common.retry')}
          />
        </View>
      ) : null}
      {status === 'ready' ? <ReadyApp /> : null}
    </View>
  );
}
