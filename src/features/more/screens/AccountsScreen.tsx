import {RefreshControl, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {EmptyIllustration} from '../../../design/motion/EmptyIllustration';
import {Amount} from '../../../design/primitives/Amount';
import {Button} from '../../../design/primitives/Button';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {FeedbackBanner} from '../../../design/primitives/FeedbackBanner';
import {IconButton} from '../../../design/primitives/IconButton';
import {ListItemSeparator} from '../../../design/primitives/ListItemSeparator';
import {ListRow} from '../../../design/primitives/ListRow';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {isCurrencyCode, money, type CurrencyCode} from '../../../domain/money/Money';
import {
  MoreListStatusBody,
  MoreRefreshBanner,
} from '../components/MoreListStates';
import {useAccountsScreen} from '../hooks/useAccountsScreen';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {AccountType} from '../../../db/repositories/accountsRepository';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {TFunction} from 'i18next';

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

function accountTypeLabel(type: AccountType, t: TFunction): string {
  switch (type) {
    case 'cash':
      return t('accountsScreen.typeCash');
    case 'bank':
      return t('accountsScreen.typeBank');
    case 'card':
      return t('accountsScreen.typeCard');
    case 'wallet':
      return t('accountsScreen.typeWallet');
  }
}

export function AccountsScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const {
    items,
    status,
    refreshing,
    refreshError,
    onRefresh,
    onRetry,
    dismissRefreshError,
    feedback,
    dismissFeedback,
    onArchive,
  } = useAccountsScreen();

  return (
    <ScreenBackdrop washHeight={220}>
      <FlashList
        style={{flex: 1}}
        data={status === 'ready' || items.length > 0 ? items : []}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
            colors={[theme.colors.accent.primary]}
          />
        }
        ItemSeparatorComponent={ListItemSeparator}
        contentContainerStyle={{
          padding: theme.space[4],
          paddingBottom: insets.bottom + theme.space[8],
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={{gap: theme.space[3], marginBottom: theme.space[3]}}>
            <MoreRefreshBanner
              visible={refreshError}
              onRetry={onRefresh}
              onDismiss={dismissRefreshError}
            />
            {feedback ? (
              <FeedbackBanner
                message={feedback}
                tone="success"
                onDismiss={dismissFeedback}
                dismissAccessibilityLabel={t('common.close')}
              />
            ) : null}
            <Button
              label={t('accountsScreen.add')}
              onPress={() => navigation.navigate('AccountForm')}
              fullWidth
            />
          </View>
        }
        ListEmptyComponent={
          <MoreListStatusBody
            status={status}
            itemCount={items.length}
            onRetry={onRetry}
            empty={
              <EmptyState
                title={t('accountsScreen.emptyTitle')}
                description={t('accountsScreen.emptyBody')}
                actionLabel={t('accountsScreen.add')}
                onAction={() => navigation.navigate('AccountForm')}
                illustration={
                  <EmptyIllustration name="Wallet" secondaryName="Plus" />
                }
              />
            }
          />
        }
        renderItem={({item}) => (
          <ListRow
            title={item.name}
            subtitle={`${accountTypeLabel(item.type, t)} · ${item.currency}`}
            icon={
              item.type === 'bank'
                ? 'Landmark'
                : item.type === 'card'
                  ? 'CreditCard'
                  : 'Wallet'
            }
            trailing={
              <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.space[1]}}>
                <Amount
                  value={money(item.balance_minor, asCurrency(String(item.currency)))}
                  size="sm"
                />
                <IconButton
                  name="Trash2"
                  tone="danger"
                  accessibilityLabel={t('accountsScreen.archiveA11y', {
                    name: item.name,
                  })}
                  onPress={() => onArchive(item.id, item.name)}
                />
              </View>
            }
            onPress={() => navigation.navigate('AccountForm', {id: item.id})}
          />
        )}
      />
    </ScreenBackdrop>
  );
}
