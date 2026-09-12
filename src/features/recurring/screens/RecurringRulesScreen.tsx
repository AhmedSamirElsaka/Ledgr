import {View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {EmptyIllustration} from '../../../design/motion/EmptyIllustration';
import {Amount} from '../../../design/primitives/Amount';
import {Button} from '../../../design/primitives/Button';
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
import {useRecurringRulesScreen} from '../hooks/useRecurringRulesScreen';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

export function RecurringRulesScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const {items, loading, loadError, refresh, onToggleActive} =
    useRecurringRulesScreen();

  if (loading) {
    return (
      <ScreenBackdrop washHeight={220}>
        <View
          style={{
            padding: theme.space[4],
            gap: theme.space[3],
          }}>
          <Skeleton height={48} radius="md" />
          <Skeleton height={72} radius="md" />
          <Skeleton height={72} radius="md" />
        </View>
      </ScreenBackdrop>
    );
  }

  if (loadError && items.length === 0) {
    return (
      <ScreenBackdrop washHeight={220}>
        <View style={{flex: 1, justifyContent: 'center'}}>
          <ErrorState
            title={t('common.errorTitle')}
            message={t('common.loadFailed')}
            onRetry={() => {
              refresh().catch(() => undefined);
            }}
          />
        </View>
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
          <View style={{marginBottom: theme.space[3]}}>
            <Button
              label={t('recurringScreen.add')}
              onPress={() => navigation.navigate('RecurringRuleForm')}
              fullWidth
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={t('recurringScreen.emptyTitle')}
            description={t('recurringScreen.emptyBody')}
            actionLabel={t('recurringScreen.add')}
            onAction={() => navigation.navigate('RecurringRuleForm')}
            illustration={<EmptyIllustration name="Calendar" />}
          />
        }
        renderItem={({item}) => {
          const signed =
            item.type === 'expense'
              ? -Math.abs(item.amount_minor)
              : item.type === 'income'
                ? Math.abs(item.amount_minor)
                : item.amount_minor;
          return (
            <Pressable
              onPress={() =>
                navigation.navigate('RecurringRuleForm', {id: item.id})
              }
              accessibilityLabel={item.name}
              style={{
                backgroundColor: theme.colors.surface.raised,
                borderRadius: theme.radius.lg,
                padding: theme.space[4],
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
                gap: theme.space[3],
                ...theme.elevation[1],
              }}>
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
                  value={money(signed, asCurrency(item.currency))}
                  size="sm"
                  signed={item.type === 'income' || item.type === 'expense'}
                  tone={
                    item.type === 'expense'
                      ? 'expense'
                      : item.type === 'income'
                        ? 'income'
                        : 'default'
                  }
                />
              </View>
              <Text variant="caption" color="tertiary">
                {t(`recurringScreen.cycle.${item.cycle}`)} ·{' '}
                {t(`recurringScreen.type.${item.type}`)} ·{' '}
                {t('recurringScreen.next', {
                  date: formatDate(new Date(item.next_occurred_at), 'd MMM'),
                })}{' '}
                ·{' '}
                {item.active === 1
                  ? t('recurringScreen.active')
                  : t('recurringScreen.paused')}
              </Text>
              <Button
                label={
                  item.active === 1
                    ? t('recurringScreen.pause')
                    : t('recurringScreen.resume')
                }
                variant="secondary"
                onPress={() => {
                  onToggleActive(item.id, item.active !== 1).catch(
                    () => undefined,
                  );
                }}
                fullWidth
              />
            </Pressable>
          );
        }}
      />
    </ScreenBackdrop>
  );
}
