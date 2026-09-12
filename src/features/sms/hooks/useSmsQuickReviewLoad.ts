import {useEffect, useMemo, useState} from 'react';

import {loadCategoryMemory} from '../../../db/smart/categoryMemoryStore';
import {loadSmsPreview} from '../../../db/sms/processSms';
import {
  getCurrency,
  isCurrencyCode,
  majorToMinor,
  minorToMajor,
  type CurrencyCode,
} from '../../../domain/money/Money';
import {suggestCategorySmart} from '../../../domain/smart/suggestCategory';
import {normalizeCurrencyCode} from '../../../domain/sms/ruleEngine';
import {useSmsReviewStore} from '../../../store/smsReviewStore';

import type {DatabaseRepos} from '../../../db/createRepos';
import type {AccountRow} from '../../../db/repositories/accountsRepository';
import type {CategoryRow} from '../../../db/repositories/categoriesRepository';
import type {SmartSuggestSource} from '../../../domain/smart/suggestCategory';
import type {SmsParseDecision} from '../../../domain/sms/classification';
import type {SmsMatchResult} from '../../../domain/sms/ruleEngine';

export type SmsCategorySuggestion = {
  source: 'rule' | SmartSuggestSource;
  hitCount?: number;
  weight?: number;
  autoAssign?: boolean;
};

export type SmsReviewDirection = 'expense' | 'income' | 'transfer';

function asCurrency(code: string | null | undefined): CurrencyCode {
  const normalized = normalizeCurrencyCode(code);
  if (normalized && isCurrencyCode(normalized)) {
    return normalized;
  }
  return code && isCurrencyCode(code) ? code : 'EGP';
}

function formatMajor(amountMinor: number, currency: CurrencyCode): string {
  const major = minorToMajor(amountMinor, currency);
  const exp = getCurrency(currency).exponent;
  return exp === 0 ? String(Math.round(major)) : major.toFixed(exp);
}

export function useSmsQuickReviewLoad(repos: DatabaseRepos) {
  const current = useSmsReviewStore(s => s.current);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [match, setMatch] = useState<SmsMatchResult | null>(null);
  const [decision, setDecision] = useState<SmsParseDecision | null>(null);
  const [categorySuggestion, setCategorySuggestion] =
    useState<SmsCategorySuggestion | null>(null);
  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('EGP');
  const [direction, setDirection] = useState<SmsReviewDirection>('expense');

  useEffect(() => {
    if (!current) {
      return;
    }
    setCategoryId(null);
    setAccountId(null);
    setToAccountId(null);
    setMatch(null);
    setDecision(null);
    setCategorySuggestion(null);
    setAmountText('');
    setCurrency('EGP');
    setDirection('expense');

    loadSmsPreview(repos, {
      sender: current.sender,
      body: current.body,
      receivedAt: new Date(current.receivedAt).toISOString(),
    })
      .then(result => {
        setMatch(result.match);
        setDecision(result.decision);
        const detectedCurrency = asCurrency(result.match?.fields.currency);
        setCurrency(detectedCurrency);
        const detected = result.match?.fields.amountMinor ?? null;
        if (detected != null) {
          setAmountText(formatMajor(detected, detectedCurrency));
        }
        const classification = result.decision.classification;
        if (classification === 'internal_transfer') {
          setDirection('transfer');
        } else if (
          classification === 'income' ||
          classification === 'transfer_in' ||
          result.match?.fields.type === 'income'
        ) {
          setDirection('income');
        } else {
          setDirection('expense');
        }
      })
      .catch(() => {
        setMatch(null);
        setDecision(null);
      });

    repos.accounts
      .listActive()
      .then(rows => {
        setAccounts(rows);
        setAccountId(rows[0]?.id ?? null);
        setToAccountId(rows[1]?.id ?? null);
      })
      .catch(() => setAccounts([]));
  }, [current, repos]);

  useEffect(() => {
    if (!current || direction === 'transfer') {
      setCategories([]);
      return;
    }
    repos.categories
      .listActive(direction)
      .then(rows => setCategories(rows))
      .catch(() => setCategories([]));
  }, [current, direction, repos]);

  useEffect(() => {
    if (!match || direction === 'transfer' || !current) {
      return;
    }

    const ruleCategoryId = match.rule.defaultCategoryId ?? null;
    if (ruleCategoryId) {
      setCategoryId(ruleCategoryId);
      setCategorySuggestion({source: 'rule', autoAssign: true});
      if (match.rule.defaultAccountId) {
        setAccountId(match.rule.defaultAccountId);
      }
      return;
    }

    const matchedMerchant = match.fields.merchant;
    const kind = direction === 'income' ? 'income' : 'expense';

    Promise.all([
      matchedMerchant
        ? repos.merchantAliases.listMerchantCategoryHistory(matchedMerchant)
        : Promise.resolve([]),
      repos.merchantAliases.listRecentMerchantCategories(120),
      loadCategoryMemory(repos.settings),
      repos.categories.listActive(kind).catch(() => [] as CategoryRow[]),
    ])
      .then(([history, recent, memory, catalogRows]) => {
        const suggestion = suggestCategorySmart({
          merchant: matchedMerchant,
          sender: current.sender,
          body: current.body,
          kind,
          history: [...history, ...recent],
          memory,
          catalog: catalogRows.map(c => ({id: c.id, name: c.name})),
        });
        if (!suggestion) {
          return;
        }
        setCategoryId(suggestion.categoryId);
        setCategorySuggestion({
          source: suggestion.source,
          hitCount: suggestion.hitCount,
          weight: suggestion.weight,
          autoAssign: suggestion.autoAssign,
        });
      })
      .catch(() => undefined);
  }, [match, direction, repos, current]);

  const amountMinor = useMemo(() => {
    const trimmed = amountText.trim().replace(',', '.');
    if (!trimmed) {
      return null;
    }
    const major = Number(trimmed);
    if (!Number.isFinite(major) || major <= 0) {
      return null;
    }
    try {
      return majorToMinor(major, currency);
    } catch {
      return null;
    }
  }, [amountText, currency]);

  const detectedAmountMinor = match?.fields.amountMinor ?? null;
  const merchant = match?.fields.merchant ?? null;
  const cardLast4 = match?.fields.cardLast4 ?? null;

  const leafCategories = useMemo(
    () =>
      categories.filter(c => {
        const hasChildren = categories.some(other => other.parent_id === c.id);
        return !hasChildren;
      }),
    [categories],
  );

  const selectCategory = (id: string) => {
    setCategoryId(id);
    setCategorySuggestion(null);
  };

  const selectDirection = (next: SmsReviewDirection) => {
    if (next === direction) {
      return;
    }
    setDirection(next);
    setCategoryId(null);
    setCategorySuggestion(null);
  };

  return {
    current,
    accounts,
    accountId,
    setAccountId,
    toAccountId,
    setToAccountId,
    categoryId,
    setCategoryId: selectCategory,
    categorySuggestion,
    match,
    decision,
    amountMinor,
    amountText,
    setAmountText,
    detectedAmountMinor,
    currency,
    setCurrency,
    merchant,
    direction,
    setDirection: selectDirection,
    cardLast4,
    leafCategories,
  };
}
