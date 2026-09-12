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
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  MoreListStatusBody,
  MoreRefreshBanner,
} from '../components/MoreListStates';
import {useTagsScreen} from '../hooks/useTagsScreen';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function TagsScreen() {
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
  } = useTagsScreen();

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
            <Button
              label={t('tagsScreen.add')}
              onPress={() => navigation.navigate('TagForm')}
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
                title={t('tagsScreen.emptyTitle')}
                description={t('tagsScreen.emptyBody')}
                actionLabel={t('tagsScreen.add')}
                onAction={() => navigation.navigate('TagForm')}
              />
            }
          />
        }
        renderItem={({item}) => (
          <ListRow
            title={item.name}
            leading={
              <View
                style={{
                  width: theme.touchTarget,
                  height: theme.touchTarget,
                  borderRadius: theme.radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.accent.primaryMuted,
                }}>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: theme.radius.full,
                    backgroundColor: item.color,
                  }}
                />
              </View>
            }
            onPress={() => navigation.navigate('TagForm', {id: item.id})}
          />
        )}
      />
    </ScreenBackdrop>
  );
}
