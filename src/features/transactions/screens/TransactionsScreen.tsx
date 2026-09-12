import {useCallback, useMemo} from 'react';

import {View} from 'react-native';

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
import {useIsRtl} from '../../../i18n/useTextInputAlign';
import {BulkCategorySheet} from '../components/BulkCategorySheet';
import {BulkSelectionBar} from '../components/BulkSelectionBar';
import {BulkTagSheet} from '../components/BulkTagSheet';
import {TransactionFiltersSheet} from '../components/TransactionFiltersSheet';
import {ROW_HEIGHT, TransactionListRow} from '../components/TransactionListRow';
import {TransactionsDayHeader} from '../components/TransactionsDayHeader';
import {TransactionsHeader} from '../components/TransactionsHeader';
import {UndoDeleteBannerBar} from '../components/UndoDeleteBannerBar';
import {useTransactionsScreen} from '../hooks/useTransactionsScreen';

import type {TransactionsListItem} from '../hooks/useTransactionsScreen';

export function TransactionsScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const isRtl = useIsRtl();
  const insets = useSafeAreaInsets();
  const screen = useTransactionsScreen();
  const {
    navigation,
    selectionMode,
    selectedIds,
    tagNamesById,
    toggleSelected,
    enterSelection,
    confirmSoftDelete,
    onSwipeableOpen,
  } = screen;
  const isEmpty = screen.items.length === 0 && screen.loadState === 'ready';

  const onPressRow = useCallback(
    (id: string) => {
      if (selectionMode) {
        toggleSelected(id);
        return;
      }
      navigation.navigate('AddTransaction', {id});
    },
    [navigation, selectionMode, toggleSelected],
  );

  const onLongPressRow = useCallback(
    (id: string) => {
      if (!selectionMode) {
        enterSelection(id);
      }
    },
    [enterSelection, selectionMode],
  );

  const onEditRow = useCallback(
    (id: string) => {
      navigation.navigate('AddTransaction', {id});
    },
    [navigation],
  );

  const onDeleteRow = useCallback(
    (id: string) => {
      confirmSoftDelete([id]);
    },
    [confirmSoftDelete],
  );

  const listExtraData = useMemo(
    () => ({
      selectedIds,
      selectionMode,
      tagNamesById,
    }),
    [selectedIds, selectionMode, tagNamesById],
  );

  const renderItem = useCallback<ListRenderItem<TransactionsListItem>>(
    ({item}) => {
      if (item.kind === 'header') {
        return (
          <TransactionsDayHeader
            group={item.group}
            baseCurrency={screen.baseCurrency}
          />
        );
      }
      const {tx, currency} = item;
      const selected = selectedIds.has(tx.id);
      return (
        <TransactionListRow
          tx={tx}
          currency={currency}
          tagNames={tagNamesById.get(tx.id) ?? []}
          selected={selected}
          selectionMode={selectionMode}
          swipeEnabled={!selectionMode}
          onPress={onPressRow}
          onLongPress={onLongPressRow}
          onEdit={onEditRow}
          onDelete={onDeleteRow}
          onSwipeableOpen={onSwipeableOpen}
        />
      );
    },
    [
      onDeleteRow,
      onEditRow,
      onLongPressRow,
      onPressRow,
      onSwipeableOpen,
      screen.baseCurrency,
      selectedIds,
      selectionMode,
      tagNamesById,
    ],
  );

  const keyExtractor = useCallback((item: TransactionsListItem) => {
    return item.kind === 'header' ? `h-${item.group.dayKey}` : item.tx.id;
  }, []);

  const getItemType = useCallback((item: TransactionsListItem) => {
    return item.kind === 'header' ? 'header' : 'row';
  }, []);

  return (
    <ScreenEnter>
      <ScreenBackdrop washHeight={300}>
        <TransactionsHeader
          topInset={insets.top}
          selectionMode={screen.selectionMode}
          selectedCount={screen.selectedCount}
          searchQuery={screen.searchQuery}
          activeFilterCount={screen.activeFilterCount}
          onSearchChange={screen.setSearchQuery}
          onExitSelection={screen.exitSelection}
          onOpenFilters={screen.openFilters}
          onClearAllFilters={screen.clearAllFilters}
        />

        {screen.loadState === 'loading' ? (
          <View
            style={{
              paddingHorizontal: theme.space[4],
              paddingTop: theme.space[2],
              gap: theme.space[3],
            }}>
            <Skeleton height={28} width="45%" />
            <Skeleton height={ROW_HEIGHT} radius="lg" />
            <Skeleton height={ROW_HEIGHT} radius="lg" />
            <Skeleton height={ROW_HEIGHT} radius="lg" />
          </View>
        ) : screen.loadState === 'error' && screen.items.length === 0 ? (
          <ErrorState
            title={t('common.errorTitle')}
            message={t('common.loadFailed')}
            retryLabel={t('common.retry')}
            onRetry={screen.onRetry}
          />
        ) : (
          <FlashList
            style={{flex: 1}}
            data={screen.items}
            extraData={listExtraData}
            keyExtractor={keyExtractor}
            getItemType={getItemType}
            drawDistance={250}
            onEndReachedThreshold={0.4}
            onScrollBeginDrag={screen.closeOpenSwipe}
            onEndReached={screen.onEndReached}
            refreshing={screen.refreshing}
            onRefresh={screen.onRefresh}
            contentContainerStyle={{
              paddingHorizontal: theme.space[4],
              paddingTop: theme.space[2],
              paddingBottom:
                insets.bottom +
                theme.space[8] +
                72 +
                (screen.selectionMode ? 72 : 0) +
                (screen.offerPending ? 64 : 0),
              ...(isEmpty
                ? {flexGrow: 1, justifyContent: 'center', paddingVertical: theme.space[8]}
                : null),
            }}
            ListEmptyComponent={
              <EmptyState
                title={screen.emptyTitle}
                description={screen.emptyDescription}
                actionLabel={screen.emptyActionLabel}
                onAction={screen.onEmptyAction}
                illustration={<EmptyIllustration name="Receipt" />}
              />
            }
            renderItem={renderItem}
          />
        )}

        {screen.selectionMode ? (
          <BulkSelectionBar
            bottomInset={insets.bottom}
            selectedCount={screen.selectedCount}
            onRecategorize={() => screen.setBulkSheet('category')}
            onAddTag={() => screen.setBulkSheet('tag')}
            onDelete={() => screen.confirmSoftDelete([...screen.selectedIds])}
          />
        ) : null}

        <UndoDeleteBannerBar
          bottomOffset={
            screen.selectionMode ? 72 : insets.bottom + theme.space[5] + 56
          }
        />

        {!screen.selectionMode ? (
          <View
            style={{
              position: 'absolute',
              bottom: insets.bottom + theme.space[5],
              ...(isRtl ? {left: theme.space[5]} : {right: theme.space[5]}),
            }}>
            <AnimatedFab
              accessibilityLabel={t('activity.addTransaction')}
              onPress={() => screen.navigation.navigate('AddTransaction')}>
              <Icon name="Plus" color={theme.colors.accent.onPrimary} size={28} />
            </AnimatedFab>
          </View>
        ) : null}

        <TransactionFiltersSheet
          visible={screen.filterSheetOpen}
          draft={screen.filterDraft}
          accounts={screen.accounts}
          categories={screen.categories}
          tags={screen.tags}
          amountCurrencyLabel={screen.baseCurrency}
          onChange={screen.setFilterDraft}
          onApply={screen.applyFilters}
          onClearAll={screen.clearAllFilters}
          onClose={() => screen.setFilterSheetOpen(false)}
        />

        <BulkCategorySheet
          visible={screen.bulkSheet === 'category'}
          categories={screen.categories}
          onSelect={screen.bulkRecategorize}
          onClose={() => screen.setBulkSheet(null)}
        />

        <BulkTagSheet
          visible={screen.bulkSheet === 'tag'}
          tags={screen.tags}
          onSelect={screen.bulkAddTag}
          onClose={() => screen.setBulkSheet(null)}
        />
      </ScreenBackdrop>
    </ScreenEnter>
  );
}
