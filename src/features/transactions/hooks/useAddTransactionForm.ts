import {useCallback, useEffect, useMemo, useState} from 'react';

import {useRepos} from '../../../db/DatabaseProvider';
import {
  getCurrency,
  majorToMinor,
  type CurrencyCode,
} from '../../../domain/money/Money';

import {asCurrency} from './addTransactionUtils';
import {useAddTransactionBudgetHint} from './useAddTransactionBudgetHint';
import {useAddTransactionEditLoad} from './useAddTransactionEditLoad';
import {useAddTransactionSmartSuggest} from './useAddTransactionSmartSuggest';
import {useAddTransactionTags} from './useAddTransactionTags';
import {useReceiptDraft} from './useReceiptDraft';

import type {AccountRow} from '../../../db/repositories/accountsRepository';
import type {CategoryRow} from '../../../db/repositories/categoriesRepository';
import type {
  TransactionSource,
  TransactionType,
} from '../../../db/repositories/transactionsRepository';

export function useAddTransactionForm(editId: string | undefined) {
  const repos = useRepos();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountText, setAmountText] = useState('');
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString());
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('EGP');
  const [step, setStep] = useState<'amount' | 'details'>('amount');
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [source, setSource] = useState<TransactionSource | null>(null);

  const tagState = useAddTransactionTags(repos);
  const {draft: receiptDraft, setDraft: setReceipt, resetFromStored, clearForDuplicate} =
    useReceiptDraft();

  const currency = useMemo(() => {
    const acc = accounts.find(a => a.id === accountId);
    return asCurrency(acc?.currency ?? baseCurrency);
  }, [accountId, accounts, baseCurrency]);
  const exponent = getCurrency(currency).exponent;

  const amountMinor = useMemo(() => {
    if (!amountText || amountText === '.') {
      return 0;
    }
    const major = Number(amountText);
    if (!Number.isFinite(major) || major <= 0) {
      return 0;
    }
    return majorToMinor(major, currency);
  }, [amountText, currency]);

  useEffect(() => {
    setSaveAsNew(false);
    setLoadError(false);
    setSource(null);
  }, [editId]);

  useAddTransactionEditLoad(repos, editId, tagState.refreshTags, {
    setBaseCurrency,
    setAccounts,
    setAccountId,
    setType,
    setCategoryId,
    setNote,
    setOccurredAt,
    setAmountText,
    setStep,
    setSelectedTagIds: tagState.setSelectedTagIds,
    setToAccountId,
    setSource,
    setLoadError,
    setReceiptPath: resetFromStored,
  });

  useEffect(() => {
    if (type === 'transfer') {
      setCategories([]);
      return;
    }
    repos.categories
      .listForPicker(type)
      .then(rows => {
        setCategories(rows);
      })
      .catch(() => setCategories([]));
  }, [repos, type]);

  // Smart default: last-used category for this type when creating.
  useEffect(() => {
    if (editId || categoryId || type === 'transfer') {
      return;
    }
    let cancelled = false;
    repos.transactions
      .listRecent(40)
      .then(rows => {
        if (cancelled) {
          return;
        }
        const hit = rows.find(
          r => r.type === type && r.category_id != null && r.category_id !== '',
        );
        if (hit?.category_id) {
          setCategoryId(hit.category_id);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [categoryId, editId, repos.transactions, type]);

  const budgetHint = useAddTransactionBudgetHint(repos, type, categoryId);
  const isEditing = Boolean(editId) && !saveAsNew;
  const {
    suggestion: categorySuggestion,
    userLocked,
    markUserPickedCategory,
  } = useAddTransactionSmartSuggest(repos, {
    type,
    note,
    categories,
    isEditing,
  });

  useEffect(() => {
    if (isEditing || userLocked || !categorySuggestion) {
      return;
    }
    setCategoryId(categorySuggestion.categoryId);
  }, [categorySuggestion, isEditing, userLocked]);

  const setCategoryIdUser = useCallback(
    (id: string | null) => {
      if (id != null) {
        markUserPickedCategory();
      }
      setCategoryId(id);
    },
    [markUserPickedCategory],
  );

  const onDuplicate = useCallback(() => {
    if (!editId) {
      return;
    }
    setSaveAsNew(true);
    setOccurredAt(new Date().toISOString());
    setStep('details');
    clearForDuplicate();
  }, [clearForDuplicate, editId]);

  const clearSaveAsNew = useCallback(() => {
    setSaveAsNew(false);
  }, []);

  return {
    type,
    setType,
    amountText,
    setAmountText,
    accounts,
    categories,
    tags: tagState.tags,
    selectedTagIds: tagState.selectedTagIds,
    newTagName: tagState.newTagName,
    accountId,
    toAccountId,
    categoryId,
    note,
    occurredAt,
    baseCurrency,
    budgetHint,
    step,
    setStep,
    currency,
    exponent,
    amountMinor,
    setAccountId,
    setToAccountId,
    setCategoryId: setCategoryIdUser,
    categorySuggestion,
    setNewTagName: tagState.setNewTagName,
    setNote,
    setOccurredAt,
    onToggleTag: tagState.onToggleTag,
    onCreateTag: tagState.onCreateTag,
    receipt: receiptDraft,
    setReceipt,
    saveAsNew,
    isEditing,
    onDuplicate,
    clearSaveAsNew,
    loadError,
    source,
  };
}
