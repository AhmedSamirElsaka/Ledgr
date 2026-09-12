import {useCallback, useMemo, useState} from 'react';

import {
  countActiveFilters,
  EMPTY_TX_FILTERS,
  type TxFilterState,
} from '../transactionFilters';

export function useTransactionsFilters() {
  const [filters, setFilters] = useState<TxFilterState>(EMPTY_TX_FILTERS);
  const [filterDraft, setFilterDraft] = useState<TxFilterState>(EMPTY_TX_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const applyFilters = useCallback(() => {
    setFilters(filterDraft);
    setFilterSheetOpen(false);
  }, [filterDraft]);

  const clearAllFilters = useCallback(() => {
    setFilters(EMPTY_TX_FILTERS);
    setFilterDraft(EMPTY_TX_FILTERS);
    setFilterSheetOpen(false);
  }, []);

  const openFilters = useCallback(() => {
    setFilterDraft(filters);
    setFilterSheetOpen(true);
  }, [filters]);

  return {
    filters,
    filterDraft,
    setFilterDraft,
    filterSheetOpen,
    setFilterSheetOpen,
    activeFilterCount,
    applyFilters,
    clearAllFilters,
    openFilters,
  };
}
