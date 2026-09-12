import {smsRuleRowToEngine, type SmsRuleRow} from '../smsRulesRepository';

describe('smsRuleRowToEngine', () => {
  it('maps DB row fields into engine rule shape', () => {
    const row: SmsRuleRow = {
      id: 'rule-1',
      name: 'CIB purchase',
      sender_pattern: 'CIB',
      body_regex: 'Purchase of (?<amount>[\\d.]+)',
      capture_map_json: JSON.stringify({amount: 'amount'}),
      default_account_id: 'acc-1',
      default_category_id: 'cat-1',
      priority: 10,
      enabled: 1,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };

    expect(smsRuleRowToEngine(row)).toEqual({
      id: 'rule-1',
      name: 'CIB purchase',
      senderPattern: 'CIB',
      bodyRegex: 'Purchase of (?<amount>[\\d.]+)',
      captureMap: {amount: 'amount'},
      priority: 10,
      enabled: true,
      defaultAccountId: 'acc-1',
      defaultCategoryId: 'cat-1',
    });
  });

  it('treats enabled=0 as false', () => {
    const row = {
      id: 'rule-2',
      name: 'Off',
      sender_pattern: 'X',
      body_regex: 'y',
      capture_map_json: '{}',
      default_account_id: null,
      default_category_id: null,
      priority: 0,
      enabled: 0,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    } satisfies SmsRuleRow;

    expect(smsRuleRowToEngine(row).enabled).toBe(false);
  });
});
