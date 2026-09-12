import {View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {EmptyIllustration} from '../../../design/motion/EmptyIllustration';
import {Amount} from '../../../design/primitives/Amount';
import {Button} from '../../../design/primitives/Button';
import {Card} from '../../../design/primitives/Card';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {ErrorState} from '../../../design/primitives/ErrorState';
import {ListItemSeparator} from '../../../design/primitives/ListItemSeparator';
import {Pressable} from '../../../design/primitives/Pressable';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Skeleton} from '../../../design/primitives/Skeleton';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {isCurrencyCode, money, type CurrencyCode} from '../../../domain/money/Money';
import {formatDate} from '../../../i18n/formatDate';
import {useSubscriptionsScreen} from '../hooks/useSubscriptionsScreen';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

function cycleLabel(
  cycle: string,
  t: (key: string) => string,
): string {
  if (cycle === 'monthly') {
    return t('subscriptionsScreen.cycleMonthly');
  }
  if (cycle === 'yearly') {
    return t('subscriptionsScreen.cycleYearly');
  }
  if (cycle === 'custom') {
    return t('subscriptionsScreen.cycleCustom');
  }
  return cycle;
}

function statusLabel(
  status: string,
  t: (key: string) => string,
): string {
  if (status === 'active') {
    return t('subscriptionsScreen.statusActive');
  }
  if (status === 'paused') {
    return t('subscriptionsScreen.statusPaused');
  }
  if (status === 'canceled' || status === 'cancelled') {
    return t('subscriptionsScreen.statusCanceled');
  }
  return status;
}

export function SubscriptionsScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const {items, monthly, yearly, base, loadState, onDetect, onRetry} =
    useSubscriptionsScreen();

  if (loadState === 'loading' && items.length === 0) {
    return (
      <ScreenBackdrop washHeight={220}>
        <View style={{padding: theme.space[4], gap: theme.space[3]}}>
          <Skeleton height={120} radius="lg" />
          <Skeleton height={48} radius="md" />
          <Skeleton height={72} radius="md" />
        </View>
      </ScreenBackdrop>
    );
  }

  if (loadState === 'error' && items.length === 0) {
    return (
      <ScreenBackdrop washHeight={220}>
        <ErrorState
          title={t('common.errorTitle')}
          message={t('common.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            onRetry().catch(() => undefined);
          }}
        />
      </ScreenBackdrop>
    );
  }

  return (
    <ScreenBackdrop washHeight={220}>
      <FlashList
        style={{flex: 1}}
        data={items}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={ListItemSeparator}
        contentContainerStyle={{
          padding: theme.space[4],
          paddingBottom: insets.bottom + theme.space[8],
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={{gap: theme.space[3], marginBottom: theme.space[3]}}>
            <Card elevated>
              <Text variant="label" color="tertiary">
                {t('subscriptionsScreen.monthlyYearly')}
              </Text>
              <View style={{marginTop: theme.space[2]}}>
                <Amount
                  value={money(-Math.abs(monthly), base)}
                  size="lg"
                  tone="expense"
                  signed
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginTop: theme.space[3],
                }}>
                <Text variant="caption" color="secondary">
                  {t('subscriptionsScreen.yearlyEstimate')}
                </Text>
                <Amount
                  value={money(-Math.abs(yearly), base)}
                  size="sm"
                  tone="expense"
                  signed
                />
              </View>
            </Card>
            <Button
              label={t('subscriptionsScreen.add')}
              onPress={() => navigation.navigate('SubscriptionForm')}
              fullWidth
            />
            <Button
              label={t('subscriptionsScreen.detect')}
              variant="secondary"
              onPress={() => {
                onDetect().catch(() => undefined);
              }}
              fullWidth
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={t('subscriptionsScreen.emptyTitle')}
            description={t('subscriptionsScreen.emptyBody')}
            actionLabel={t('subscriptionsScreen.add')}
            onAction={() => navigation.navigate('SubscriptionForm')}
            illustration={<EmptyIllustration name="Calendar" />}
          />
        }
        renderItem={({item}) => (
          <Card elevated padded={false}>
            <Pressable
              onPress={() =>
                navigation.navigate('SubscriptionForm', {id: item.id})
              }
              accessibilityLabel={item.name}
              style={{padding: theme.space[4]}}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: theme.space[3],
                }}>
                <Text variant="bodyStrong" style={{flex: 1}} numberOfLines={1}>
                  {item.name}
                </Text>
                <Amount
                  value={money(
                    -Math.abs(item.amount_minor),
                    asCurrency(item.currency),
                  )}
                  size="sm"
                  tone="expense"
                  signed
                />
              </View>
              <Text
                variant="caption"
                color="tertiary"
                style={{marginTop: theme.space[1]}}>
                {cycleLabel(item.cycle, t)}
                {' · '}
                {t('subscriptionsScreen.due', {
                  date: formatDate(new Date(item.next_due_date), 'd MMM'),
                })}
                {' · '}
                {statusLabel(item.status, t)}
              </Text>
            </Pressable>
          </Card>
        )}
      />
    </ScreenBackdrop>
  );
}
