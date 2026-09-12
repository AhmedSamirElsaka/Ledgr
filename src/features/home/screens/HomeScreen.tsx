import {useCallback} from 'react';

import {Platform, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {FlashList, type ListRenderItem} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Icon} from '../../../design/icons/Icon';
import {AnimatedFab} from '../../../design/motion/AnimatedFab';
import {EmptyIllustration} from '../../../design/motion/EmptyIllustration';
import {ScreenEnter} from '../../../design/motion/ScreenEnter';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {ErrorState} from '../../../design/primitives/ErrorState';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Skeleton} from '../../../design/primitives/Skeleton';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';
import {useIsRtl} from '../../../i18n/useTextInputAlign';
import {setPrefBoolean} from '../../../lib/prefs';
import {
  TransactionRowContent,
  UndoDeleteBannerBar,
} from '../../transactions';
import {HomeHeader} from '../components/HomeHeader';
import {useHomeScreen} from '../hooks/useHomeScreen';

import type {HomeStackParamList, RootTabParamList} from '../../../app/navigation/types';
import type {TransactionRow} from '../../../db/repositories/transactionsRepository';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

type HomeNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>,
  BottomTabNavigationProp<RootTabParamList>
>;

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

export function HomeScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const isRtl = useIsRtl();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNavigation>();
  const {
    period,
    setPeriod,
    spendMinor,
    baseCurrency,
    accounts,
    recent,
    tagNamesById,
    streak,
    showCashPrompt,
    setShowCashPrompt,
    repos,
    loadState,
    refreshing,
    onRefresh,
    onRetry,
  } = useHomeScreen();

  const createCashAccount = useCallback(async () => {
    await repos.accounts.create({
      name: 'Cash',
      type: 'cash',
      currency: baseCurrency,
      openingBalanceMinor: 0,
      color: theme.colors.accent.primary,
      icon: 'Wallet',
    });
    await repos.settings.set('onboarding.completed', '1');
    setShowCashPrompt(false);
  }, [baseCurrency, repos, setShowCashPrompt, theme.colors.accent.primary]);

  const onOpenTransaction = useCallback(
    (id: string) => {
      navigation.navigate('AddTransaction', {id});
    },
    [navigation],
  );

  const renderItem = useCallback<ListRenderItem<TransactionRow>>(
    ({item}) => (
      <TransactionRowContent
        tx={item}
        currency={asCurrency(item.currency)}
        tagNames={tagNamesById.get(item.id) ?? []}
        selected={false}
        selectionMode={false}
        onPress={onOpenTransaction}
        onLongPress={onOpenTransaction}
      />
    ),
    [onOpenTransaction, tagNamesById],
  );

  const fabBottom = insets.bottom + theme.space[5];
  const fabSideStyle = isRtl
    ? {left: theme.space[5]}
    : {right: theme.space[5]};

  return (
    <ScreenEnter>
      <ScreenBackdrop washHeight={320}>
        {loadState === 'loading' ? (
          <View
            style={{
              paddingTop: insets.top + theme.space[5],
              paddingHorizontal: theme.space[4],
              gap: theme.space[3],
            }}>
            <Skeleton height={28} width="35%" />
            <Skeleton height={40} width="70%" />
            <Skeleton height={120} radius="lg" />
            <Skeleton height={72} radius="lg" />
            <Skeleton height={72} radius="lg" />
          </View>
        ) : loadState === 'error' && recent.length === 0 ? (
          <ErrorState
            title={t('common.errorTitle')}
            message={t('common.loadFailed')}
            retryLabel={t('common.retry')}
            onRetry={onRetry}
          />
        ) : (
          <FlashList
            style={{flex: 1}}
            data={recent}
            keyExtractor={item => item.id}
            drawDistance={250}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={{
              paddingTop: insets.top + theme.space[5],
              paddingHorizontal: theme.space[4],
              paddingBottom: fabBottom + 80,
            }}
            ListHeaderComponent={
              <View style={{marginBottom: theme.space[2]}}>
                <HomeHeader
                  period={period}
                  setPeriod={setPeriod}
                  showCashPrompt={showCashPrompt}
                  baseCurrency={baseCurrency}
                  spendMinor={spendMinor}
                  streak={streak}
                  accounts={accounts}
                  onCreateCash={() => {
                    createCashAccount().catch(() => undefined);
                  }}
                  onDismissCash={() => {
                    setPrefBoolean('onboarding.cashPromptDismissed', true);
                    setShowCashPrompt(false);
                  }}
                  onOpenBudgets={() => navigation.navigate('Budgets')}
                  onOpenInsights={() => navigation.navigate('Analytics')}
                  onOpenAccounts={() =>
                    navigation.navigate('More', {screen: 'Accounts'})
                  }
                  onOpenAccount={id =>
                    navigation.navigate('More', {
                      screen: 'AccountForm',
                      params: {id},
                    })
                  }
                  onImportSms={
                    Platform.OS === 'android'
                      ? () =>
                          navigation.navigate('More', {
                            screen: 'SmsInbox',
                          })
                      : undefined
                  }
                />
              </View>
            }
            ListEmptyComponent={
              <EmptyState
                title={t('home.emptyTitle')}
                description={t('home.emptyBody')}
                actionLabel={t('home.emptyAction')}
                onAction={() => navigation.navigate('AddTransaction')}
                illustration={
                  <EmptyIllustration name="Receipt" />
                }
              />
            }
            renderItem={renderItem}
          />
        )}

        <UndoDeleteBannerBar bottomOffset={80} />

        <View
          style={{
            position: 'absolute',
            bottom: fabBottom,
            ...fabSideStyle,
          }}>
          <AnimatedFab
            accessibilityLabel={t('home.addTransactionA11y')}
            onPress={() => navigation.navigate('AddTransaction')}>
            <Icon name="Plus" color={theme.colors.accent.onPrimary} size={28} />
          </AnimatedFab>
        </View>
      </ScreenBackdrop>
    </ScreenEnter>
  );
}
