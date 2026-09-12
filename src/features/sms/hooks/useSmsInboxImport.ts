import {useState} from 'react';

import {useTranslation} from 'react-i18next';

import {processSmsMessage} from '../../../db/sms/processSms';
import {
  listInboxSms,
  requestSmsPermission,
  requestSmsReviewNotificationPermission,
  type SmsImportPeriod,
} from '../../../lib/smsAndroid';
import {drainPendingSms} from '../../../native/smsReceived';

import type {DatabaseRepos} from '../../../db/createRepos';

type ImportArgs = {
  repos: DatabaseRepos;
  selectedPeriod: SmsImportPeriod | null;
  periodSummary: string;
  validateCustomDates: () => boolean;
  refresh: () => Promise<void>;
};

export type SmsImportFeedback = {
  tone: 'success' | 'warning' | 'error' | 'info';
  message: string;
};

export function useSmsInboxImport({
  repos,
  selectedPeriod,
  periodSummary,
  validateCustomDates,
  refresh,
}: ImportArgs) {
  const {t} = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [feedback, setFeedback] = useState<SmsImportFeedback | null>(null);

  const clearFeedback = () => setFeedback(null);

  const onImport = async () => {
    if (!validateCustomDates() || !selectedPeriod) {
      setFeedback({
        tone: 'warning',
        message: t('smsInbox.invalidDateRange'),
      });
      return;
    }
    setScanning(true);
    setFeedback(null);
    try {
      const granted = await requestSmsPermission();
      if (!granted) {
        setFeedback({
          tone: 'warning',
          message: t('smsInbox.permissionDenied'),
        });
        return;
      }
      // In-context: review alerts need POST_NOTIFICATIONS after SMS is enabled.
      await requestSmsReviewNotificationPermission();

      const pending = await drainPendingSms();
      for (const sms of pending) {
        const received = new Date(sms.receivedAt).getTime();
        if (
          received < selectedPeriod.minDateMs ||
          received > (selectedPeriod.maxDateMs ?? Date.now())
        ) {
          continue;
        }
        await processSmsMessage(repos, {
          sender: sms.sender,
          body: sms.body,
          receivedAt: new Date(sms.receivedAt).toISOString(),
          deferTransaction: true,
        });
      }

      const messages = await listInboxSms(selectedPeriod);
      let review = 0;
      let ignored = 0;
      let skippedExisting = 0;
      for (const sms of messages) {
        const result = await processSmsMessage(repos, {
          sender: sms.address || 'unknown',
          body: sms.body || '',
          receivedAt: new Date(sms.date || Date.now()).toISOString(),
          deferTransaction: true,
          deviceSmsId: sms._id != null ? String(sms._id) : null,
        });
        if (result.status === 'deferred' || result.status === 'needs_review') {
          review += 1;
        } else if (result.reason === 'Already imported (fingerprint)') {
          skippedExisting += 1;
        } else {
          ignored += 1;
        }
      }
      setFeedback({
        tone: 'success',
        message: t('smsInbox.importComplete', {
          period: periodSummary,
          review,
          skipped: ignored + skippedExisting,
          pending: pending.length,
        }),
      });
      await refresh();
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err instanceof Error ? err.message : t('smsInbox.importFailed'),
      });
    } finally {
      setScanning(false);
    }
  };

  return {scanning, onImport, feedback, clearFeedback};
}
