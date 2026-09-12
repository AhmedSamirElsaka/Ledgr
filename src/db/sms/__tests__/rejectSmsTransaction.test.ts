import {
  serializeIgnoredSimilarSetting,
  SMS_IGNORED_SIMILAR_SETTING_KEY,
} from '../../../domain/sms/ignoreSimilar';
import {rejectSmsTransaction} from '../rejectSmsTransaction';

import type {SmsMessageRow} from '../../repositories/smsMessagesRepository';
import type {TransactionRow} from '../../repositories/transactionsRepository';

describe('rejectSmsTransaction', () => {
  const timestamp = '2026-01-02T12:00:00.000Z';

  function smsTx(overrides: Partial<TransactionRow> = {}): TransactionRow {
    return {
      id: 'tx-1',
      account_id: 'account-1',
      category_id: 'cat-1',
      amount_minor: -1000,
      currency: 'EGP',
      fx_rate_to_base: 1,
      base_amount_minor: -1000,
      type: 'expense',
      transfer_pair_id: null,
      note: null,
      merchant: 'Uber',
      receipt_path: null,
      occurred_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
      source: 'sms',
      source_ref: 'sms:msg-1',
      deleted_at: null,
      auto_categorized: 0,
      ...overrides,
    };
  }

  it('soft-deletes, marks linked SMS ignored, and stores ignore-similar', async () => {
    const softDelete = jest.fn(async () => undefined);
    const updateStatus = jest.fn(async () => undefined);
    const settingsSet = jest.fn(async () => undefined);
    const linked: SmsMessageRow = {
      id: 'msg-1',
      sender: 'CIBEG',
      body: 'paid at Uber',
      received_at: timestamp,
      status: 'parsed',
      matched_rule_id: null,
      created_transaction_id: 'tx-1',
      dedupe_hash: null,
      fingerprint: null,
      device_sms_id: null,
      parse_method: null,
      parse_confidence: null,
      parse_reason: null,
      extracted_reference: null,
      created_at: timestamp,
    };

    const result = await rejectSmsTransaction(
      {
        transactions: {
          getById: async () => smsTx(),
          softDelete,
        },
        smsMessages: {
          findByCreatedTransactionId: async () => linked,
          getById: async () => null,
          updateStatus,
        },
        settings: {
          get: async () => null,
          set: settingsSet,
        },
      },
      'tx-1',
      {ignoreSimilar: true},
    );

    expect(softDelete).toHaveBeenCalledWith('tx-1');
    expect(updateStatus).toHaveBeenCalledWith('msg-1', 'ignored');
    expect(result.ignoredSimilar).toBe(true);
    expect(settingsSet).toHaveBeenCalledWith(
      SMS_IGNORED_SIMILAR_SETTING_KEY,
      serializeIgnoredSimilarSetting([{sender: 'CIBEG', merchant: 'uber'}]),
    );
  });

  it('rejects non-SMS sources', async () => {
    await expect(
      rejectSmsTransaction(
        {
          transactions: {
            getById: async () => smsTx({source: 'manual'}),
            softDelete: async () => undefined,
          },
          smsMessages: {
            findByCreatedTransactionId: async () => null,
            getById: async () => null,
            updateStatus: async () => undefined,
          },
          settings: {get: async () => null, set: async () => undefined},
        },
        'tx-1',
        {ignoreSimilar: false},
      ),
    ).rejects.toThrow(/Only SMS/);
  });
});
