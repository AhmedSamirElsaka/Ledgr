import {useCallback, useEffect, useState} from 'react';

import {useUiStore} from '../../../store/uiStore';

import {useAnalyticsScreenData} from './useAnalyticsScreenData';

export function useAnalyticsScreen() {
  const period = useUiStore(s => s.period);
  const setPeriod = useUiStore(s => s.setPeriod);
  const customFrom = useUiStore(s => s.customFrom);
  const customTo = useUiStore(s => s.customTo);
  const setCustomRange = useUiStore(s => s.setCustomRange);
  const [draftFrom, setDraftFrom] = useState(customFrom);
  const [draftTo, setDraftTo] = useState(customTo);

  const data = useAnalyticsScreenData();

  useEffect(() => {
    setDraftFrom(customFrom);
    setDraftTo(customTo);
  }, [customFrom, customTo]);

  const applyCustomRange = useCallback(() => {
    setCustomRange(draftFrom.trim(), draftTo.trim());
  }, [draftFrom, draftTo, setCustomRange]);

  return {
    period,
    setPeriod,
    draftFrom,
    setDraftFrom,
    draftTo,
    setDraftTo,
    applyCustomRange,
    ...data,
    empty: data.stats.count === 0,
  };
}
