import {useCallback, useEffect, useMemo, useState} from 'react';

import {useTranslation} from 'react-i18next';

import {confirmSmsTransaction, loadSmsPreview} from '../../../db/sms/processSms';
import {resolvePublicCategoryId} from '../../../db/sms/publicCategory';
import {isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';
import {normalizeCurrencyCode} from '../../../domain/sms/ruleEngine';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';

import type {SmsInboxListItem} from './useSmsInboxList';
import type {DatabaseRepos} from '../../../db/createRepos';

export type SmsBulkFeedback = {
  message: string;
  tone: 'success' | 'warning' | 'info' | 'error';
};

export type SmsBulkEligibility = {
  ready: SmsInboxListItem[];
  needsReview: SmsInboxListItem[];
  nonTransaction: SmsInboxListItem[];
  duplicate: SmsInboxListItem[];
};

function asCurrency(code: string | null | undefined): CurrencyCode | null {
  const normalized = normalizeCurrencyCode(code);
  if (normalized && isCurrencyCode(normalized)) {
    return normalized;
  }
  return code && isCurrencyCode(code) ? code : null;
}

export function useSmsInboxBulk(args: {
  repos: DatabaseRepos;
  items: readonly SmsInboxListItem[];
  refresh: () => Promise<void>;
}) {
  const {t} = useTranslation();
  const {repos, items, refresh} = args;
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [tracking, setTracking] = useState(false);
  const [feedback, setFeedback] = useState<SmsBulkFeedback | null>(null);
  const [pendingSummary, setPendingSummary] = useState<SmsBulkEligibility | null>(null);

  useEffect(() => {
    setSelectedIds(prev => {
      const valid = new Set(items.map(item => item.id));
      const next = new Set<string>();
      for (const id of prev) {
        if (valid.has(id)) {
          next.add(id);
        }
      }
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  const selectedCount = selectedIds.size;
  const allSelected = items.length > 0 && selectedCount === items.length;

  const clearFeedback = useCallback(() => setFeedback(null), []);

  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true);
    setFeedback(null);
    setPendingSummary(null);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setPendingSummary(null);
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setPendingSummary(null);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectionMode(true);
    setPendingSummary(null);
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setPendingSummary(null);
    setSelectedIds(new Set());
  }, []);

  const classifySelection = useCallback(async (): Promise<SmsBulkEligibility> => {
    const selectedItems = items.filter(item => selectedIds.has(item.id));
    const ready: SmsInboxListItem[] = [];
    const needsReview: SmsInboxListItem[] = [];
    const nonTransaction: SmsInboxListItem[] = [];
    const duplicate: SmsInboxListItem[] = [];

    const {loadIgnoredSimilarPatterns} = await import('../../../db/sms/ignoredSimilar');
    const {matchesIgnoreSimilar} = await import('../../../domain/sms/ignoreSimilar');
    const ignoredPatterns = await loadIgnoredSimilarPatterns(repos.settings);

    for (const item of selectedItems) {
      const preview = await loadSmsPreview(repos, {
        sender: item.sender,
        body: item.body,
        receivedAt: item.received_at,
      });
      const decision = preview.decision;
      if (
        matchesIgnoreSimilar(ignoredPatterns, {
          sender: item.sender,
          merchant: preview.match?.fields.merchant,
        })
      ) {
        nonTransaction.push(item);
        continue;
      }
      if (decision.classification === 'non_transaction') {
        nonTransaction.push(item);
        continue;
      }
      if (
        !decision.highConfidence ||
        decision.classification === 'ambiguous' ||
        decision.classification === 'internal_transfer' ||
        preview.match?.fields.amountMinor == null ||
        asCurrency(preview.match?.fields.currency) == null
      ) {
        needsReview.push(item);
        continue;
      }
      ready.push(item);
    }

    return {ready, needsReview, nonTransaction, duplicate};
  }, [items, repos, selectedIds]);

  const trackSelected = useCallback(async () => {
    if (selectedIds.size === 0 || tracking) {
      return;
    }
    setTracking(true);
    setFeedback(null);
    try {
      const summary = pendingSummary ?? (await classifySelection());
      setPendingSummary(summary);

      if (!pendingSummary) {
        // First tap: show summary and wait for confirm via second trackSelected call.
        setFeedback({
          message: t('smsInbox.trackSummary', {
            ready: summary.ready.length,
            review: summary.needsReview.length,
            ignored: summary.nonTransaction.length,
          }),
          tone: summary.ready.length > 0 ? 'info' : 'warning',
        });
        return;
      }

      const accounts = await repos.accounts.listActive();
      const defaultAccountId = accounts[0]?.id ?? null;
      if (!defaultAccountId) {
        setFeedback({
          message: t('smsInbox.trackFailed'),
          tone: 'error',
        });
        return;
      }

      const expenseCategoryId = await resolvePublicCategoryId(repos.categories, 'expense');
      const incomeCategoryId = await resolvePublicCategoryId(repos.categories, 'income');

      let tracked = 0;
      let failed = 0;
      let duplicates = 0;

      for (const item of summary.ready) {
        try {
          const preview = await loadSmsPreview(repos, {
            sender: item.sender,
            body: item.body,
            receivedAt: item.received_at,
          });
          const amountMinor = preview.match?.fields.amountMinor ?? null;
          const currency = asCurrency(preview.match?.fields.currency);
          if (amountMinor == null || currency == null) {
            failed += 1;
            continue;
          }
          const kind = preview.match?.fields.type === 'income' ? 'income' : 'expense';
          const accountId =
            preview.match?.rule.defaultAccountId &&
            accounts.some(a => a.id === preview.match?.rule.defaultAccountId)
              ? preview.match.rule.defaultAccountId
              : defaultAccountId;
          const result = await confirmSmsTransaction(repos, {
            sender: item.sender,
            body: item.body,
            receivedAt: item.received_at,
            existingMessageId: item.id,
            accountId,
            categoryId: kind === 'income' ? incomeCategoryId : expenseCategoryId,
            amountMinorOverride: amountMinor,
            currencyOverride: currency,
            typeOverride: kind,
            skipMerchantLearning: true,
            userConfirmed: true,
            skipIgnoreSimilar: false,
          });
          if (result.status === 'parsed') {
            tracked += 1;
          } else if (result.status === 'duplicate') {
            duplicates += 1;
          } else {
            failed += 1;
          }
        } catch {
          failed += 1;
        }
      }

      await refresh();
      exitSelectionMode();

      if (tracked > 0 && failed === 0) {
        hapticSuccess();
        setFeedback({
          message: t('smsInbox.trackCompleteDetailed', {
            tracked,
            review: summary.needsReview.length,
            ignored: summary.nonTransaction.length,
            duplicates,
          }),
          tone: 'success',
        });
      } else {
        hapticWarning();
        setFeedback({
          message: t('smsInbox.trackPartial', {
            tracked,
            skipped: summary.needsReview.length + summary.nonTransaction.length,
            failed,
          }),
          tone: 'warning',
        });
      }
    } catch (err) {
      hapticWarning();
      setFeedback({
        message: err instanceof Error ? err.message : t('smsInbox.trackFailed'),
        tone: 'error',
      });
    } finally {
      setTracking(false);
    }
  }, [
    classifySelection,
    exitSelectionMode,
    pendingSummary,
    refresh,
    repos,
    selectedIds.size,
    t,
    tracking,
  ]);

  const selectedLabel = useMemo(
    () => t('smsInbox.selectedCount', {count: selectedCount}),
    [selectedCount, t],
  );

  return {
    selectionMode,
    selectedIds,
    selectedCount,
    allSelected,
    tracking,
    feedback,
    selectedLabel,
    pendingSummary,
    clearFeedback,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelected,
    selectAll,
    clearSelection,
    trackSelected,
  };
}
