import {useEffect, useState} from 'react';

import {hapticImpact} from '../../../lib/haptics';
import {useSmsReviewStore} from '../../../store/smsReviewStore';

import type {SmsReviewDirection} from './useSmsQuickReviewLoad';
import type {SmsReviewPayload} from '../../../store/smsReviewStore';

type ChromeParams = {
  current: SmsReviewPayload | null;
  autoAction: SmsReviewPayload['autoAction'] | undefined;
  saving: boolean;
  amountMinor: number | null;
  accountId: string | null;
  direction: SmsReviewDirection;
  onIgnore: () => Promise<void>;
  onTrack: () => Promise<void>;
};

export function useSmsQuickReviewChrome({
  current,
  autoAction,
  saving,
  amountMinor,
  accountId,
  direction,
  onIgnore,
  onTrack,
}: ChromeParams) {
  const clearAutoAction = useSmsReviewStore(s => s.clearAutoAction);
  const [showNote, setShowNote] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!current) {
      return;
    }
    hapticImpact();
    setShowNote(false);
    setShowMore(false);
    setShowMessage(false);
  }, [current]);

  // Notification shade quick actions.
  useEffect(() => {
    if (!current || !autoAction || saving) {
      return;
    }
    if (autoAction === 'ignore') {
      clearAutoAction();
      onIgnore().catch(() => undefined);
      return;
    }
    if (autoAction === 'track') {
      if (amountMinor == null || accountId == null) {
        return;
      }
      if (direction === 'transfer') {
        clearAutoAction();
        return;
      }
      clearAutoAction();
      onTrack().catch(() => undefined);
    }
  }, [
    autoAction,
    clearAutoAction,
    current,
    saving,
    amountMinor,
    accountId,
    direction,
    onIgnore,
    onTrack,
  ]);

  return {
    showNote,
    setShowNote,
    showMore,
    setShowMore,
    showMessage,
    setShowMessage,
  };
}
