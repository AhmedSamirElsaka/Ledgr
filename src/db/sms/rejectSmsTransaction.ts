import {addIgnoredSimilarPattern} from './ignoredSimilar';

import type {SettingsRepository} from '../repositories/settingsRepository';
import type {SmsMessagesRepository} from '../repositories/smsMessagesRepository';
import type {TransactionsRepository} from '../repositories/transactionsRepository';

export type RejectSmsTransactionResult = {
  ignoredSimilar: boolean;
};

export type RejectSmsRepos = {
  transactions: Pick<TransactionsRepository, 'getById' | 'softDelete'>;
  smsMessages: Pick<
    SmsMessagesRepository,
    'findByCreatedTransactionId' | 'getById' | 'updateStatus'
  >;
  settings: Pick<SettingsRepository, 'get' | 'set'>;
};

/**
 * Soft-delete an SMS-sourced transaction and optionally teach ignore-similar
 * so future matching SMS are auto-ignored on ingest.
 * Caller should publish the undo banner after success.
 */
export async function rejectSmsTransaction(
  repos: RejectSmsRepos,
  transactionId: string,
  options: {ignoreSimilar: boolean},
): Promise<RejectSmsTransactionResult> {
  const tx = await repos.transactions.getById(transactionId);
  if (!tx) {
    throw new Error('Transaction not found');
  }
  if (tx.source !== 'sms') {
    throw new Error('Only SMS transactions can be rejected');
  }

  await repos.transactions.softDelete(transactionId);

  const linked =
    (await repos.smsMessages.findByCreatedTransactionId(transactionId)) ??
    (tx.source_ref?.startsWith('sms:')
      ? await repos.smsMessages.getById(tx.source_ref.slice('sms:'.length))
      : null);

  if (linked && linked.status !== 'ignored') {
    await repos.smsMessages.updateStatus(linked.id, 'ignored');
  }

  let ignoredSimilar = false;
  if (options.ignoreSimilar) {
    const sender = linked?.sender;
    if (sender) {
      const pattern = await addIgnoredSimilarPattern(repos.settings, {
        sender,
        merchant: tx.merchant,
      });
      ignoredSimilar = pattern != null;
    }
  }

  return {ignoredSimilar};
}
