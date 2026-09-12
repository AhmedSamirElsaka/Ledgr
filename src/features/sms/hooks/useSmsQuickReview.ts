import {useEffect, useState} from 'react';

import {useRepos} from '../../../db/DatabaseProvider';

import {useSmsQuickReviewActions} from './useSmsQuickReviewActions';
import {useSmsQuickReviewLoad} from './useSmsQuickReviewLoad';

export function useSmsQuickReview() {
  const repos = useRepos();
  const load = useSmsQuickReviewLoad(repos);
  const [note, setNote] = useState('');
  const currentKey = load.current
    ? load.current.messageId ??
      `${load.current.sender}\0${load.current.receivedAt}`
    : null;

  useEffect(() => {
    if (!currentKey) {
      return;
    }
    setNote('');
  }, [currentKey]);

  const actions = useSmsQuickReviewActions({
    repos,
    current: load.current,
    match: load.match,
    categoryId: load.categoryId,
    accountId: load.accountId,
    toAccountId: load.toAccountId,
    note,
    amountMinor: load.amountMinor,
    currency: load.currency,
    direction: load.direction,
  });

  return {
    current: load.current,
    accounts: load.accounts,
    accountId: load.accountId,
    setAccountId: load.setAccountId,
    toAccountId: load.toAccountId,
    setToAccountId: load.setToAccountId,
    categoryId: load.categoryId,
    setCategoryId: load.setCategoryId,
    categorySuggestion: load.categorySuggestion,
    note,
    setNote,
    saving: actions.saving,
    error: actions.error,
    match: load.match,
    decision: load.decision,
    amountMinor: load.amountMinor,
    amountText: load.amountText,
    setAmountText: load.setAmountText,
    detectedAmountMinor: load.detectedAmountMinor,
    currency: load.currency,
    merchant: load.merchant,
    direction: load.direction,
    setDirection: load.setDirection,
    cardLast4: load.cardLast4,
    leafCategories: load.leafCategories,
    onSave: actions.onSave,
    onTrack: actions.onTrack,
    onIgnore: actions.onIgnore,
    onSnooze: actions.onSnooze,
  };
}
