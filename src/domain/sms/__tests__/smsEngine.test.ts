import {suggestCategoryFromHistory} from '../autoCategorize';
import {dedupeHash, isLikelyDuplicate} from '../dedupe';
import {SMS_FIXTURES} from '../fixtures';
import {cleanMerchant} from '../merchantCleanup';
import {
  matchSms,
  parseAmountToMinor,
  senderMatches,
  suggestRuleFromBody,
  type SmsRule,
} from '../ruleEngine';


describe('merchantCleanup', () => {
  it('strips auth codes and title-cases', () => {
    expect(cleanMerchant('  UBER*TRIP AUTH:AB12CD  ')).toBe('Uber Trip');
  });

  it('collapses whitespace', () => {
    expect(cleanMerchant('COFFEE    HOUSE')).toBe('Coffee House');
  });
});

describe('dedupe', () => {
  it('hashes sender+amount+window', () => {
    const a = dedupeHash({
      sender: 'BANK-ALERT',
      amountMinor: 15000,
      receivedAtMs: 1_700_000_000_000,
    });
    const b = dedupeHash({
      sender: 'bank-alert',
      amountMinor: 15000,
      receivedAtMs: 1_700_000_000_000 + 60_000,
    });
    expect(a).toBe(b);
  });

  it('differs across windows', () => {
    const a = dedupeHash({
      sender: 'BANK',
      amountMinor: 100,
      receivedAtMs: 0,
      windowMs: 60_000,
    });
    const b = dedupeHash({
      sender: 'BANK',
      amountMinor: 100,
      receivedAtMs: 120_000,
      windowMs: 60_000,
    });
    expect(a).not.toBe(b);
    expect(isLikelyDuplicate(new Set([a]), {sender: 'BANK', amountMinor: 100, receivedAtMs: 0, windowMs: 60_000})).toBe(
      true,
    );
  });
});

describe('autoCategorize', () => {
  it('requires ≥3 same-category hits', () => {
    const history = [
      {merchant: 'Uber', categoryId: 'transport'},
      {merchant: 'Uber', categoryId: 'transport'},
      {merchant: 'Uber', categoryId: 'food'},
    ];
    expect(suggestCategoryFromHistory('Uber', history, 3)).toBeNull();
    history.push({merchant: 'Uber', categoryId: 'transport'});
    expect(suggestCategoryFromHistory('Uber', history, 3)).toEqual({
      categoryId: 'transport',
      hitCount: 3,
      autoAssigned: true,
    });
  });
});

describe('ruleEngine', () => {
  const rules: SmsRule[] = [
    {
      id: 'r-purchase',
      name: 'Purchase',
      senderPattern: 'BANK',
      bodyRegex:
        "purchase of (?<amount>[\\d,.]+) (?<currency>[A-Z]{3}) at (?<merchant>[A-Za-z0-9 .&'-]+?)(?=\\s+on\\b|\\.|$)",
      captureMap: {amount: 'amount', currency: 'currency', merchant: 'merchant'},
      priority: 10,
      enabled: true,
    },
    {
      id: 'r-withdraw',
      name: 'Withdrawal',
      senderPattern: 'BANK',
      bodyRegex: 'ATM withdrawal (?<amount>[\\d,.]+) (?<currency>[A-Z]{3})',
      captureMap: {amount: 'amount', currency: 'currency'},
      priority: 20,
      enabled: true,
    },
    {
      id: 'r-transfer',
      name: 'Transfer',
      senderPattern: '/WALLET|BANK/i',
      bodyRegex:
        "transfer of (?<amount>[\\d,.]+) (?<currency>[A-Z]{3}) to (?<merchant>[A-Za-z0-9 .&'-]+?)(?=\\s+completed|\\.|$)",
      captureMap: {amount: 'amount', currency: 'currency', merchant: 'merchant'},
      priority: 15,
      enabled: true,
    },
    {
      id: 'r-credit',
      name: 'Credit',
      senderPattern: 'BANK',
      bodyRegex: 'credited (?<amount>[\\d,.]+) (?<currency>[A-Z]{3})',
      captureMap: {amount: 'amount', currency: 'currency'},
      priority: 30,
      enabled: true,
    },
    {
      id: 'r-instapay',
      name: 'InstaPay-style',
      senderPattern: 'IPN',
      bodyRegex:
        "InstaPay.?style payment (?<amount>[\\d,.]+) (?<currency>[A-Z]{3}) to (?<merchant>[A-Za-z0-9 .&'-]+?)(?=\\s+received|\\.|$)",
      captureMap: {amount: 'amount', currency: 'currency', merchant: 'merchant'},
      priority: 5,
      enabled: true,
    },
    {
      id: 'r-card',
      name: 'Card ending',
      senderPattern: 'CARD',
      bodyRegex:
        "card ending (?<cardLast4>\\d{4}).*?(?<amount>[\\d,.]+) (?<currency>[A-Z]{3}) at (?<merchant>[A-Za-z0-9 .&'-]+?)(?=\\s+completed|\\.|$)",
      captureMap: {
        amount: 'amount',
        currency: 'currency',
        merchant: 'merchant',
        cardLast4: 'cardLast4',
      },
      priority: 12,
      enabled: true,
    },
  ];

  it('matches sender patterns', () => {
    expect(senderMatches('MyBANK Alerts', 'BANK')).toBe(true);
    expect(senderMatches('WALLET-EG', '/WALLET|BANK/i')).toBe(true);
    expect(senderMatches('SHOP', 'BANK')).toBe(false);
  });

  it('parses amounts with commas', () => {
    expect(parseAmountToMinor('1,250.50', 'EGP')).toBe(125050);
    expect(parseAmountToMinor('100', 'JPY')).toBe(100);
  });

  it('parses fixture corpus with priority ordering', () => {
    for (const fixture of SMS_FIXTURES) {
      const hit = matchSms(
        {sender: fixture.sender, body: fixture.body, receivedAt: fixture.receivedAt},
        rules,
      );
      expect(hit).not.toBeNull();
      expect(hit?.rule.id).toBe(fixture.expectedRuleId);
      expect(hit?.fields.amountMinor).toBe(fixture.expectedAmountMinor);
      if (fixture.expectedMerchant) {
        expect(hit?.fields.merchant).toBe(fixture.expectedMerchant);
      }
      if (fixture.expectedType) {
        expect(hit?.fields.type).toBe(fixture.expectedType);
      }
      if (fixture.expectedCardLast4) {
        expect(hit?.fields.cardLast4).toBe(fixture.expectedCardLast4);
      }
    }
  });

  it('prefers lower priority number', () => {
    const sms = {
      sender: 'IPN',
      body: 'InstaPay-style payment 50.00 EGP to Cafe Nile',
      receivedAt: new Date().toISOString(),
    };
    const hit = matchSms(sms, rules);
    expect(hit?.rule.id).toBe('r-instapay');
  });

  it('suggests a rule from a pasted body', () => {
    const suggestion = suggestRuleFromBody(
      'Purchase of 99.00 EGP at Coffee House card ending 4321',
    );
    expect(suggestion.captureMap.amount).toBe('amount');
    expect(suggestion.bodyRegex.includes('(?<amount>')).toBe(true);
  });

  it('detects Arabic digits and heuristic amounts without rules', () => {
    expect(parseAmountToMinor('١٢٥.٥٠', 'EGP')).toBe(12550);
    const hit = matchSms(
      {
        sender: 'CIB',
        body: 'تم خصم مبلغ 250.00 جنيه من بطاقتك عند Carrefour',
        receivedAt: new Date().toISOString(),
      },
      [],
    );
    expect(hit?.fields.amountMinor).toBe(25000);
    expect(hit?.fields.type).toBe('expense');
  });

  it('maps LE currency alias to EGP exponent', () => {
    expect(parseAmountToMinor('10.5', 'LE')).toBe(1050);
  });

  it('rejects clock times and non-money SMS as expenses', () => {
    expect(parseAmountToMinor('2:64', 'EGP')).toBeNull();
    expect(parseAmountToMinor('14:30', 'EGP')).toBeNull();

    const nonMoney = [
      'Someone tried to call you at 2:64',
      'Missed call from Ahmed at 2:46',
      'You have a missed call at 14:30',
      'OTP is 264531. Do not share',
      'Your verification code is 123456',
      'مكالمة فائتة الساعة 2:46',
      'Your available balance is 1500 EGP',
    ];
    for (const body of nonMoney) {
      const hit = matchSms(
        {sender: 'NOTIFY', body, receivedAt: new Date().toISOString()},
        [],
      );
      expect(hit).toBeNull();
    }
  });

  it('still extracts real purchase amounts heuristically', () => {
    const hit = matchSms(
      {
        sender: 'BANK',
        body: 'Purchase of 99.00 EGP at Coffee House. Available balance 2,000.00 EGP.',
        receivedAt: new Date().toISOString(),
      },
      [],
    );
    expect(hit?.fields.amountMinor).toBe(9900);
    expect(hit?.fields.type).toBe('expense');
  });

  it('classifies outgoing vs incoming transfers', () => {
    const outgoing = matchSms(
      {
        sender: 'BANK',
        body: 'Transfer of 250.50 EGP to Ali Hassan completed.',
        receivedAt: new Date().toISOString(),
      },
      rules,
    );
    expect(outgoing?.fields.type).toBe('expense');

    const instapayOut = matchSms(
      {
        sender: 'IPN',
        body: 'InstaPay-style payment 50.00 EGP to Cafe Nile',
        receivedAt: new Date().toISOString(),
      },
      rules,
    );
    expect(instapayOut?.fields.type).toBe('expense');

    const incoming = matchSms(
      {
        sender: 'BANK',
        body: 'You received a transfer of 120.00 EGP from Sara Ali.',
        receivedAt: new Date().toISOString(),
      },
      [],
    );
    expect(incoming?.fields.amountMinor).toBe(12000);
    expect(incoming?.fields.type).toBe('income');

    const arabicIn = matchSms(
      {
        sender: 'CIB',
        body: 'تم استلام تحويل بمبلغ 200.00 جنيه من أحمد',
        receivedAt: new Date().toISOString(),
      },
      [],
    );
    expect(arabicIn?.fields.amountMinor).toBe(20000);
    expect(arabicIn?.fields.type).toBe('income');

    const arabicOut = matchSms(
      {
        sender: 'CIB',
        body: 'تم تحويل مبلغ 150.00 جنيه الى محمد',
        receivedAt: new Date().toISOString(),
      },
      [],
    );
    expect(arabicOut?.fields.amountMinor).toBe(15000);
    expect(arabicOut?.fields.type).toBe('expense');

    const paymentReceivedAt = matchSms(
      {
        sender: 'BANK',
        body: 'Payment of 50.00 EGP received at COFFEE HOUSE',
        receivedAt: new Date().toISOString(),
      },
      [],
    );
    expect(paymentReceivedAt?.fields.type).toBe('expense');
  });
});
