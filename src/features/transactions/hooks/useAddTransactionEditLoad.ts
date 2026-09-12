import {useEffect, type Dispatch, type SetStateAction} from 'react';

import {getCurrency, type CurrencyCode} from '../../../domain/money/Money';

import {asCurrency} from './addTransactionUtils';

import type {DatabaseRepos} from '../../../db/createRepos';
import type {AccountRow} from '../../../db/repositories/accountsRepository';
import type {
  TransactionSource,
  TransactionType,
} from '../../../db/repositories/transactionsRepository';

type EditLoadSetters = {
  setBaseCurrency: Dispatch<SetStateAction<CurrencyCode>>;
  setAccounts: Dispatch<SetStateAction<AccountRow[]>>;
  setAccountId: Dispatch<SetStateAction<string | null>>;
  setType: Dispatch<SetStateAction<TransactionType>>;
  setCategoryId: Dispatch<SetStateAction<string | null>>;
  setNote: Dispatch<SetStateAction<string>>;
  setOccurredAt: Dispatch<SetStateAction<string>>;
  setAmountText: Dispatch<SetStateAction<string>>;
  setStep: Dispatch<SetStateAction<'amount' | 'details'>>;
  setSelectedTagIds: Dispatch<SetStateAction<string[]>>;
  setToAccountId: Dispatch<SetStateAction<string | null>>;
  setSource?: Dispatch<SetStateAction<TransactionSource | null>>;
  setLoadError?: Dispatch<SetStateAction<boolean>>;
  setReceiptPath?: (path: string | null) => void;
};

export function useAddTransactionEditLoad(
  repos: DatabaseRepos,
  editId: string | undefined,
  refreshTags: () => Promise<void>,
  setters: EditLoadSetters,
) {
  useEffect(() => {
    (async () => {
      setters.setLoadError?.(false);
      const base = (await repos.settings.get('base_currency')) ?? 'EGP';
      setters.setBaseCurrency(asCurrency(base));
      const accs = await repos.accounts.listActive();
      setters.setAccounts(accs);
      setters.setAccountId(prev => prev ?? accs[0]?.id ?? null);
      await refreshTags();

      if (!editId) {
        setters.setSource?.(null);
        return;
      }
      const existing = await repos.transactions.getById(editId);
      if (!existing) {
        setters.setLoadError?.(true);
        return;
      }
      setters.setType(existing.type);
      setters.setAccountId(existing.account_id);
      setters.setCategoryId(existing.category_id);
      setters.setNote(existing.note ?? '');
      setters.setOccurredAt(existing.occurred_at);
      setters.setSource?.(existing.source);
      setters.setReceiptPath?.(existing.receipt_path);
      const exp = getCurrency(asCurrency(existing.currency)).exponent;
      setters.setAmountText(String(Math.abs(existing.amount_minor) / 10 ** exp));
      setters.setStep('details');
      const linked = await repos.tags.getTagsForTransaction(editId);
      setters.setSelectedTagIds(linked.map(t => t.id));
      if (existing.type === 'transfer' && existing.transfer_pair_id) {
        const pair = await repos.transactions.getById(existing.transfer_pair_id);
        if (pair) {
          if (existing.amount_minor < 0) {
            setters.setToAccountId(pair.account_id);
          } else {
            setters.setAccountId(pair.account_id);
            setters.setToAccountId(existing.account_id);
          }
        }
      }
    })().catch(() => {
      setters.setLoadError?.(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setters are stable state updaters
  }, [editId, refreshTags, repos]);
}
