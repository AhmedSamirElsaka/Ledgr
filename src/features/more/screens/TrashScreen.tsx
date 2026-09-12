import {RefreshControl, View} from 'react-native';

import {FlashList} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {EmptyIllustration} from '../../../design/motion/EmptyIllustration';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {ListItemSeparator} from '../../../design/primitives/ListItemSeparator';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  MoreListStatusBody,
  MoreRefreshBanner,
} from '../components/MoreListStates';
import {TrashListRow} from '../components/TrashListRow';
import {TRASH_WINDOW_DAYS, useTrashScreen} from '../hooks/useTrashScreen';

export function TrashScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const {
    rows,
    status,
    refreshing,
    refreshError,
    onRefresh,
    onRetry,
    dismissRefreshError,
    onRestore,
    onPermanentDelete,
  } = useTrashScreen();

  return (
    <ScreenBackdrop washHeight={220}>
      <FlashList
        style={{flex: 1}}
        data={status === 'ready' || rows.length > 0 ? rows : []}
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
              {t('trashScreen.intro', {days: TRASH_WINDOW_DAYS})}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <MoreListStatusBody
            status={status}
            itemCount={rows.length}
            onRetry={onRetry}
            empty={
              <EmptyState
                title={t('trashScreen.emptyTitle')}
                description={t('trashScreen.emptyBody')}
                illustration={<EmptyIllustration name="Trash2" />}
              />
            }
          />
        }
        renderItem={({item}) => (
          <TrashListRow
            item={item}
            onRestore={onRestore}
            onPermanentDelete={onPermanentDelete}
          />
        )}
      />
    </ScreenBackdrop>
  );
}
