import {useCallback} from 'react';

import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import {useUiStore} from '../../../store/uiStore';

import {useUndoDeleteOfferPending} from './undoDeleteBanner';
import {useTransactionsFilters} from './useTransactionsFilters';
import {useTransactionsQuery} from './useTransactionsQuery';
import {useTransactionsSelection} from './useTransactionsSelection';

import type {TransactionsStackParamList} from '../../../app/navigation/types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export type {TransactionsListItem} from './useTransactionsQuery';

export function useTransactionsScreen() {
  const {t} = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<TransactionsStackParamList>>();
  const searchQuery = useUiStore(s => s.searchQuery);
  const setSearchQuery = useUiStore(s => s.setSearchQuery);
  const offerPending = useUndoDeleteOfferPending();

  const {
    filters,
    filterDraft,
    setFilterDraft,
    filterSheetOpen,
    setFilterSheetOpen,
    activeFilterCount,
    applyFilters,
    clearAllFilters,
    openFilters,
  } = useTransactionsFilters();
  const query = useTransactionsQuery(filters, searchQuery);
  const selection = useTransactionsSelection();

  const filtered = activeFilterCount > 0 || Boolean(searchQuery.trim());
  const emptyTitle = filtered
    ? t('activity.emptyFilteredTitle')
    : t('activity.emptyTitle');
  const emptyDescription = filtered
    ? t('activity.emptyFilteredBody')
    : t('activity.emptyBody');
  const emptyActionLabel = filtered
    ? t('activity.clearFilters')
    : t('activity.addTransaction');

  const onEmptyAction = useCallback(() => {
    if (activeFilterCount > 0 || searchQuery.trim()) {
      setSearchQuery('');
      clearAllFilters();
      return;
    }
    navigation.navigate('AddTransaction');
  }, [activeFilterCount, clearAllFilters, navigation, searchQuery, setSearchQuery]);

  return {
    navigation,
    searchQuery,
    setSearchQuery,
    ...query,
    filters,
    filterDraft,
    setFilterDraft,
    filterSheetOpen,
    setFilterSheetOpen,
    activeFilterCount,
    applyFilters,
    clearAllFilters,
    openFilters,
    ...selection,
    emptyTitle,
    emptyDescription,
    emptyActionLabel,
    onEmptyAction,
    offerPending,
  };
}
