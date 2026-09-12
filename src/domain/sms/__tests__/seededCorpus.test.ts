import {STARTER_SMS_RULES} from '../../../db/seedSmsRules';
import {createId} from '../../../lib/id';
import {classifySms} from '../classification';
import {
  matchSms,
  parseAmountToMinor,
  serializeCaptureMap,
  type SmsRule,
} from '../ruleEngine';

function starterAsEngineRules(): SmsRule[] {
  return STARTER_SMS_RULES.map((rule, index) => ({
    id: `seed-${index}`,
    name: rule.name,
    senderPattern: rule.senderPattern,
    bodyRegex: rule.bodyRegex,
    captureMap: rule.captureMap,
    priority: rule.priority,
    enabled: true,
  }));
}

describe('seeded SMS rules corpus', () => {
  const rules = starterAsEngineRules();

  const shouldParse: Array<{
    id: string;
    sender: string;
    body: string;
    amountMinor: number;
    type: 'expense' | 'income';
  }> = [
    {
      id: 'purchase',
      sender: 'BANK-ALERT',
      body: 'Purchase of 150.00 EGP at COFFEE HOUSE on 10-Sep.',
      amountMinor: 15000,
      type: 'expense',
    },
    {
      id: 'atm',
      sender: 'BANK-ATM',
      body: 'ATM withdrawal 500.00 EGP successful. Fee 5.00 EGP.',
      amountMinor: 50000,
      type: 'expense',
    },
    {
      id: 'outgoing-transfer',
      sender: 'WALLET-EG',
      body: 'Transfer of 250.50 EGP to Ali Hassan completed.',
      amountMinor: 25050,
      type: 'expense',
    },
    {
      id: 'incoming-transfer',
      sender: 'BANK-ALERT',
      body: 'You received a transfer of 120.00 EGP from Sara Ali.',
      amountMinor: 12000,
      type: 'income',
    },
    {
      id: 'salary',
      sender: 'BANK-SALARY',
      body: 'Your account was credited 8000.00 EGP salary deposit.',
      amountMinor: 800000,
      type: 'income',
    },
    {
      id: 'arabic-debit',
      sender: 'CIB',
      body: 'تم خصم مبلغ 250.00 جنيه من بطاقتك عند Carrefour',
      amountMinor: 25000,
      type: 'expense',
    },
    {
      id: 'arabic-in',
      sender: 'NBE',
      body: 'تم استلام تحويل بمبلغ 200.00 جنيه من أحمد',
      amountMinor: 20000,
      type: 'income',
    },
    {
      id: 'payment-received-confirmation',
      sender: 'BANK-ALERT',
      body: 'Payment of 50.00 EGP received at COFFEE HOUSE',
      amountMinor: 5000,
      type: 'expense',
    },
    {
      id: 'upi',
      sender: 'UPI-SBI',
      body: 'UPI payment Rs. 99.00 to MERCHANT OK',
      amountMinor: 9900,
      type: 'expense',
    },
  ];

  const shouldIgnore = [
    'Someone tried to call you at 2:46',
    'OTP is 264531. Do not share',
    'Your available balance is 1500 EGP',
    'Your credit limit is 50,000.00 EGP',
    'Pre-approved loan offer 10000 EGP',
  ];

  it('parses labeled transactional corpus with seeded rules', () => {
    for (const sample of shouldParse) {
      const decision = classifySms(
        {
          sender: sample.sender,
          body: sample.body,
          receivedAt: new Date().toISOString(),
        },
        rules,
      );
      expect(decision.classification).not.toBe('non_transaction');
      expect(decision.match?.fields.amountMinor).toBe(sample.amountMinor);
      expect(decision.match?.fields.type).toBe(sample.type);
    }
  });

  it('rejects non-transaction / balance / promo samples', () => {
    for (const body of shouldIgnore) {
      const decision = classifySms(
        {sender: 'NOTIFY', body, receivedAt: new Date().toISOString()},
        rules,
      );
      expect(decision.classification).toBe('non_transaction');
      expect(decision.match).toBeNull();
      expect(matchSms({sender: 'NOTIFY', body, receivedAt: new Date().toISOString()}, rules)).toBeNull();
    }
  });

  it('flags internal transfers for paired review', () => {
    const decision = classifySms(
      {
        sender: 'BANK-ALERT',
        body: 'Internal transfer of 300.00 EGP between your accounts completed.',
        receivedAt: new Date().toISOString(),
      },
      rules,
    );
    expect(decision.classification).toBe('internal_transfer');
    expect(decision.highConfidence).toBe(false);
  });

  it('keeps capture map serialization stable for seed inserts', () => {
    const json = serializeCaptureMap({amount: 'amount', currency: 'currency'});
    expect(json).toContain('"amount":"amount"');
    expect(createId().length).toBeGreaterThan(8);
    expect(parseAmountToMinor('99.00', 'INR')).toBe(9900);
  });
});
