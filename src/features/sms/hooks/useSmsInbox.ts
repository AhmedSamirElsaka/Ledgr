import {useRepos} from '../../../db/DatabaseProvider';

import {SMS_INBOX_PERIOD_CHOICES, useSmsInboxPeriod} from './smsInboxPeriod';
import {useSmsInboxBulk} from './useSmsInboxBulk';
import {useSmsInboxImport} from './useSmsInboxImport';
import {useSmsInboxList} from './useSmsInboxList';

export {SMS_INBOX_PERIOD_CHOICES};

export function useSmsInbox() {
  const repos = useRepos();
  const period = useSmsInboxPeriod();
  const list = useSmsInboxList();
  const {scanning, onImport, feedback, clearFeedback} = useSmsInboxImport({
    repos,
    selectedPeriod: period.selectedPeriod,
    periodSummary: period.periodSummary,
    validateCustomDates: period.validateCustomDates,
    refresh: list.refresh,
  });
  const bulk = useSmsInboxBulk({
    repos,
    items: list.items,
    refresh: list.refresh,
  });

  return {
    items: list.items,
    listState: list.state,
    listError: list.errorMessage,
    refreshList: list.refresh,
    scanning,
    feedback: bulk.feedback ?? feedback,
    clearFeedback: () => {
      bulk.clearFeedback();
      clearFeedback();
    },
    periodId: period.periodId,
    setPeriodId: period.setPeriodId,
    isCustom: period.isCustom,
    customFrom: period.customFrom,
    setCustomFrom: period.setCustomFrom,
    customTo: period.customTo,
    setCustomTo: period.setCustomTo,
    fromError: period.fromError,
    toError: period.toError,
    selectedPeriod: period.selectedPeriod,
    periodSummary: period.periodSummary,
    onImport,
    selectionMode: bulk.selectionMode,
    selectedIds: bulk.selectedIds,
    selectedCount: bulk.selectedCount,
    allSelected: bulk.allSelected,
    tracking: bulk.tracking,
    pendingSummary: bulk.pendingSummary,
    enterSelectionMode: bulk.enterSelectionMode,
    exitSelectionMode: bulk.exitSelectionMode,
    toggleSelected: bulk.toggleSelected,
    selectAll: bulk.selectAll,
    clearSelection: bulk.clearSelection,
    trackSelected: bulk.trackSelected,
  };
}
