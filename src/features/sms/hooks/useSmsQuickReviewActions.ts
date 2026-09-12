import {useEffect, useState} from 'react';

import {useTranslation} from 'react-i18next';

import {confirmSmsTransaction} from '../../../db/sms/processSms';
import {resolvePublicCategoryId} from '../../../db/sms/publicCategory';
import {HEURISTIC_RULE_ID} from '../../../domain/sms/ruleEngine';
import {hapticSuccess} from '../../../lib/haptics';
import {useSmsReviewStore} from '../../../store/smsReviewStore';

import type {SmsReviewDirection} from './useSmsQuickReviewLoad';
import type {DatabaseRepos} from '../../../db/createRepos';
import type {CurrencyCode} from '../../../domain/money/Money';
import type {SmsMatchResult} from '../../../domain/sms/ruleEngine';
import type {SmsReviewPayload} from '../../../store/smsReviewStore';

type ActionArgs = {
  repos: DatabaseRepos;
  current: SmsReviewPayload | null;
  match: SmsMatchResult | null;
  categoryId: string | null;
  accountId: string | null;
  toAccountId: string | null;
  note: string;
  amountMinor: number | null;
  currency: CurrencyCode;
  direction: SmsReviewDirection;
};

export function useSmsQuickReviewActions({
  repos,
  current,
  match,
  categoryId,
  accountId,
  toAccountId,
  note,
  amountMinor,
  currency,
  direction,
}: ActionArgs) {
  const {t} = useTranslation();
  const dismissCurrent = useSmsReviewStore(s => s.dismissCurrent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [current]);

  const saveWithCategory = async (resolvedCategoryId: string | null) => {
    if (!current) {
      return;
    }
    if (amountMinor == null) {
      setError(t('smsReview.amountError'));
      return;
    }
    if (!accountId) {
      setError(t('smsReview.pickAccount'));
      return;
    }
    if (direction === 'transfer') {
      if (!toAccountId || toAccountId === accountId) {
        setError(t('smsReview.pickTransferAccounts'));
        return;
      }
    } else if (!resolvedCategoryId) {
      setError(t('smsReview.pickCategory'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await confirmSmsTransaction(repos, {
        sender: current.sender,
        body: current.body,
        receivedAt: new Date(current.receivedAt).toISOString(),
        categoryId: direction === 'transfer' ? null : resolvedCategoryId,
        accountId,
        toAccountId: direction === 'transfer' ? toAccountId ?? undefined : undefined,
        note: note.trim() || null,
        existingMessageId: current.messageId,
        amountMinorOverride: amountMinor,
        currencyOverride: currency,
        typeOverride: direction,
        userConfirmed: true,
      });
      if (result.status === 'parsed') {
        hapticSuccess();
        dismissCurrent();
      } else if (result.status === 'duplicate') {
        setError(t('smsReview.duplicate'));
        dismissCurrent();
      } else {
        setError(result.reason ?? t('smsReview.saveFailed', {status: result.status}));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    await saveWithCategory(categoryId);
  };

  const onTrack = async () => {
    if (direction === 'transfer') {
      await saveWithCategory(null);
      return;
    }
    const kind = direction === 'income' ? 'income' : 'expense';
    try {
      const publicCategoryId = await resolvePublicCategoryId(repos.categories, kind);
      await saveWithCategory(publicCategoryId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('smsReview.saveFailed', {status: 'error'}),
      );
    }
  };

  const onSnooze = () => {
    dismissCurrent();
  };

  const onIgnore = async () => {
    if (!current) {
      return;
    }
    setSaving(true);
    try {
      const matchedRuleId =
        match?.rule.id && match.rule.id !== HEURISTIC_RULE_ID ? match.rule.id : null;
      if (current.messageId) {
        await repos.smsMessages.updateStatus(current.messageId, 'ignored', {
          matchedRuleId,
        });
      } else {
        await repos.smsMessages.create({
          sender: current.sender,
          body: current.body,
          receivedAt: new Date(current.receivedAt).toISOString(),
          status: 'ignored',
          matchedRuleId,
          dedupeHash: null,
        });
      }
    } catch {
      // still dismiss
    } finally {
      setSaving(false);
      dismissCurrent();
    }
  };

  return {saving, error, onSave, onTrack, onIgnore, onSnooze};
}
