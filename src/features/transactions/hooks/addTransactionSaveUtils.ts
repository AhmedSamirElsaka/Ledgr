import {
  deleteReceiptFile,
  importReceiptFile,
} from '../../../db/receipts/receiptStorage';
import {resolveFxRateToBase} from '../../../db/repositories/fxRatesRepository';
import {TransactionMutationError} from '../../../db/repositories/transactionsRepository';
import {recordCategoryTeach} from '../../../db/smart/categoryMemoryStore';
import {addTransactionSchema} from '../../../domain/transactions/schemas';

import {type ReceiptDraft} from './useReceiptDraft';

import type {DatabaseRepos} from '../../../db/createRepos';
import type {TransactionType} from '../../../db/repositories/transactionsRepository';
import type {CurrencyCode} from '../../../domain/money/Money';
import type {z} from 'zod';

export type SaveFormState = {
  type: TransactionType;
  amountMinor: number;
  accountId: string | null;
  toAccountId: string | null;
  categoryId: string | null;
  note: string;
  occurredAt: string;
  currency: CurrencyCode;
  baseCurrency: CurrencyCode;
  selectedTagIds: string[];
  receipt: ReceiptDraft;
};

type ParsedSave = z.infer<typeof addTransactionSchema>;

export function parseSaveForm(form: SaveFormState) {
  return addTransactionSchema.safeParse({
    type: form.type,
    amountMinor: form.amountMinor,
    accountId: form.accountId ?? '',
    toAccountId: form.toAccountId ?? undefined,
    categoryId: form.categoryId,
    note: form.note.trim() || undefined,
    occurredAt: form.occurredAt,
  });
}

export async function resolveRateToBase(
  repos: DatabaseRepos,
  currency: CurrencyCode,
  baseCurrency: CurrencyCode,
): Promise<number> {
  return resolveFxRateToBase(repos.fxRates, currency, baseCurrency);
}

async function persistReceiptForTransaction(
  repos: DatabaseRepos,
  transactionId: string,
  receipt: ReceiptDraft,
  previousPath: string | null,
): Promise<void> {
  if (receipt.removed) {
    await deleteReceiptFile(previousPath);
    if (previousPath != null) {
      await repos.transactions.update(transactionId, {receiptPath: null});
    }
    return;
  }

  if (!receipt.pendingSourceUri) {
    return;
  }

  const nextPath = await importReceiptFile({
    sourceUri: receipt.pendingSourceUri,
    transactionId,
    mimeType: receipt.pendingMimeType,
    previousRelativePath: previousPath,
  });
  await repos.transactions.update(transactionId, {receiptPath: nextPath});
}

export async function persistTransaction(
  repos: DatabaseRepos,
  editId: string | undefined,
  form: SaveFormState,
  parsed: ParsedSave,
): Promise<void> {
  const {type, amountMinor, occurredAt} = form;
  const rateToBase = await resolveRateToBase(repos, form.currency, form.baseCurrency);
  const baseAmount = Math.round(amountMinor * rateToBase);
  let transactionId = editId ?? null;
  let previousReceiptPath: string | null = null;

  if (editId) {
    const existing = await repos.transactions.getById(editId);
    if (!existing) {
      throw new Error('Transaction not found');
    }
    previousReceiptPath = existing.receipt_path;
    if (existing.type === 'transfer' && type === 'transfer') {
      const pair = existing.transfer_pair_id
        ? await repos.transactions.getById(existing.transfer_pair_id)
        : null;
      if (!pair || !parsed.toAccountId) {
        throw new TransactionMutationError(
          'invalid_transfer_pair',
          'This transfer pair is invalid and cannot be edited safely.',
        );
      }
      const fromAccountId = existing.amount_minor < 0 ? existing.account_id : pair.account_id;
      const toAccountId = existing.amount_minor < 0 ? pair.account_id : existing.account_id;
      if (parsed.accountId !== fromAccountId || parsed.toAccountId !== toAccountId) {
        throw new TransactionMutationError(
          'transfer_account_change_not_supported',
          'Changing accounts on an existing transfer is not supported.',
        );
      }
    }
    await repos.transactions.update(editId, {
      accountId: type === 'transfer' ? undefined : parsed.accountId,
      categoryId: type === 'transfer' ? null : parsed.categoryId,
      amountMinor,
      currency: form.currency,
      fxRateToBase: rateToBase,
      baseAmountMinor: baseAmount,
      type,
      note: parsed.note ?? null,
      merchant: parsed.note?.trim() || null,
      occurredAt,
    });
  } else if (type === 'transfer') {
    if (!parsed.toAccountId) {
      throw new TransactionMutationError('invalid_transfer_pair', 'Pick a destination account.');
    }
    const pair = await repos.transactions.createTransfer({
      fromAccountId: parsed.accountId,
      toAccountId: parsed.toAccountId,
      amountMinor,
      currency: form.currency,
      fxRateToBase: rateToBase,
      baseAmountMinor: baseAmount,
      note: parsed.note ?? null,
      occurredAt,
    });
    transactionId = pair.out.id;
  } else {
    const created = await repos.transactions.create({
      accountId: parsed.accountId,
      categoryId: parsed.categoryId,
      amountMinor,
      currency: form.currency,
      fxRateToBase: rateToBase,
      baseAmountMinor: baseAmount,
      type,
      note: parsed.note ?? null,
      merchant: parsed.note?.trim() || null,
      occurredAt,
      source: 'manual',
    });
    transactionId = created.id;
  }

  if (transactionId && type !== 'transfer' && parsed.categoryId && parsed.note?.trim()) {
    await recordCategoryTeach(repos.settings, {
      merchant: parsed.note.trim(),
      categoryId: parsed.categoryId,
      kind: type === 'income' ? 'income' : 'expense',
    }).catch(() => undefined);
  }

  if (transactionId && type !== 'transfer') {
    await repos.tags.setTagsForTransaction(transactionId, form.selectedTagIds);
  }

  if (transactionId && type !== 'transfer') {
    await persistReceiptForTransaction(
      repos,
      transactionId,
      form.receipt,
      previousReceiptPath,
    );
  }
}
