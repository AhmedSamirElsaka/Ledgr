import {useCallback, useEffect, useState} from 'react';

import {StyleSheet, View} from 'react-native';

import {useNavigation, useRoute} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {endOfDay, format} from 'date-fns';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useRepos} from '../../../db/DatabaseProvider';
import {Amount} from '../../../design/primitives/Amount';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {ErrorState} from '../../../design/primitives/ErrorState';
import {Pressable} from '../../../design/primitives/Pressable';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Skeleton} from '../../../design/primitives/Skeleton';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {isCurrencyCode, money, type CurrencyCode} from '../../../domain/money/Money';
import {periodRange} from '../../../domain/period/periodRange';
import {useUiStore} from '../../../store/uiStore';

import type {
  AnalyticsStackParamList,
  RootTabParamList,
} from '../../../app/navigation/types';
import type {TransactionRow} from '../../../db/repositories/transactionsRepository';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {CompositeNavigationProp, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<AnalyticsStackParamList, 'AnalyticsTransactions'>,
  BottomTabNavigationProp<RootTabParamList>
>;

/**
 * Job: list the transactions behind one insight slice as a dense ledger.
 */
export function AnalyticsTransactionsScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepos();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<AnalyticsStackParamList, 'AnalyticsTransactions'>>();
  const period = useUiStore(s => s.period);
  const customFrom = useUiStore(s => s.customFrom);
  const customTo = useUiStore(s => s.customTo);
  const [items, setItems] = useState<TransactionRow[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  const refresh = useCallback(async () => {
    setLoadState('loading');
    const range = periodRange(period, new Date(), {
      fromIso: customFrom,
      toIso: customTo,
    });
    const list = await repos.transactions.list({
      categoryId: route.params?.categoryId,
      accountId: route.params?.accountId,
      source: route.params?.source,
      excludeSource: route.params?.excludeSource,
      fromIso: range?.fromIso ?? '1970-01-01T00:00:00.000Z',
      toIso: range?.toIso ?? endOfDay(new Date()).toISOString(),
      search: route.params?.merchant,
      limit: 200,
    });
    setItems(list);
    setLoadState('ready');
  }, [
    customFrom,
    customTo,
    period,
    repos,
    route.params?.accountId,
    route.params?.categoryId,
    route.params?.excludeSource,
    route.params?.merchant,
    route.params?.source,
  ]);

  useEffect(() => {
    refresh().catch(() => setLoadState('error'));
  }, [refresh]);

  const openTx = useCallback(
    (id: string) => {
      navigation.navigate('Home', {
        screen: 'AddTransaction',
        params: {id},
      });
    },
    [navigation],
  );

  if (loadState === 'loading' && items.length === 0) {
    return (
      <ScreenBackdrop>
        <View style={{padding: theme.space[4], gap: theme.space[3]}}>
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </View>
      </ScreenBackdrop>
    );
  }

  if (loadState === 'error' && items.length === 0) {
    return (
      <ScreenBackdrop>
        <ErrorState
          title={t('common.errorTitle')}
          message={t('common.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            refresh().catch(() => undefined);
          }}
        />
      </ScreenBackdrop>
    );
  }

  return (
    <ScreenBackdrop>
      <FlashList
        style={{flex: 1}}
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={{
          paddingHorizontal: theme.space[4],
          paddingBottom: insets.bottom + theme.space[8],
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            title={t('insights.drillEmptyTitle')}
            description={t('insights.drillEmptyBody')}
          />
        }
        renderItem={({item}) => {
          const signed =
            item.type === 'expense'
              ? -Math.abs(item.base_amount_minor)
              : item.type === 'income'
                ? Math.abs(item.base_amount_minor)
                : item.base_amount_minor;
          return (
            <Pressable
              onPress={() => openTx(item.id)}
              accessibilityLabel={item.merchant ?? item.note ?? item.type}
              style={{
                paddingVertical: theme.space[3],
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.border.subtle,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[3],
              }}>
              <View style={{flex: 1, gap: theme.space[1]}}>
                <Text variant="body" numberOfLines={1}>
                  {item.merchant ?? item.note ?? item.type}
                </Text>
                <Text variant="caption" color="tertiary">
                  {format(new Date(item.occurred_at), 'd MMM yyyy')}
                </Text>
              </View>
              <Amount
                value={money(signed, asCurrency(item.currency))}
                size="sm"
                signed={item.type === 'income' || item.type === 'expense'}
                tone={
                  item.type === 'income'
                    ? 'income'
                    : item.type === 'expense'
                      ? 'expense'
                      : 'default'
                }
              />
            </Pressable>
          );
        }}
      />
    </ScreenBackdrop>
  );
}
