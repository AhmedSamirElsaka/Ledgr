import {RefreshControl, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Button} from '../../../design/primitives/Button';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {ListItemSeparator} from '../../../design/primitives/ListItemSeparator';
import {ListRow} from '../../../design/primitives/ListRow';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  MoreListStatusBody,
  MoreRefreshBanner,
} from '../components/MoreListStates';
import {useMerchantAliasesScreen} from '../hooks/useMerchantAliasesScreen';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function MerchantAliasesScreen() {
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
  } = useMerchantAliasesScreen();

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
            <Text variant="body" color="secondary">
              {t('merchantAliasesScreen.intro')}
            </Text>
            <Button
              label={t('merchantAliasesScreen.add')}
              onPress={() => navigation.navigate('MerchantAliasForm')}
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
                title={t('merchantAliasesScreen.emptyTitle')}
                description={t('merchantAliasesScreen.emptyBody')}
                actionLabel={t('merchantAliasesScreen.add')}
                onAction={() => navigation.navigate('MerchantAliasForm')}
              />
            }
          />
        }
        renderItem={({item}) => {
          const used =
            item.hit_count > 0
              ? ` · ${t('merchantAliasesScreen.usedCount', {count: item.hit_count})}`
              : '';
          return (
            <ListRow
              title={item.raw_merchant}
              subtitle={`${t('merchantAliasesScreen.mapsTo', {
                name: item.display_merchant,
              })}${used}`}
              icon="Store"
              onPress={() =>
                navigation.navigate('MerchantAliasForm', {id: item.id})
              }
            />
          );
        }}
      />
    </ScreenBackdrop>
  );
}
