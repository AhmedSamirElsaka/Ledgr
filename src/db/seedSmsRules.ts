import {serializeCaptureMap, type SmsCaptureMap} from '../domain/sms/ruleEngine';
import {createId, nowIso} from '../lib/id';

import type {SqlDatabase} from './types';

type StarterRule = {
  name: string;
  senderPattern: string;
  bodyRegex: string;
  captureMap: SmsCaptureMap;
  priority: number;
};

/**
 * Versioned starter rules — precise debit/credit/transfer templates.
 * Prefer bank-like sender patterns; avoid balance-only triggers.
 */
export const STARTER_SMS_RULES: StarterRule[] = [
  {
    name: 'Card ending purchase',
    senderPattern: '/bank|card|visa|mastercard|cib|nbe|banque|hsbc|qnb|aaib/i',
    bodyRegex:
      "card\\s+(?:ending|no\\.?|number|#)?\\s*(?<cardLast4>\\d{4}).*?(?<amount>[\\d.,\\s]+)\\s*(?<currency>[A-Z]{3}|LE|E£|SR|KD|INR)?\\s*(?:at|@|to)\\s+(?<merchant>[\\w .&'\\-]{2,60})",
    captureMap: {
      amount: 'amount',
      currency: 'currency',
      merchant: 'merchant',
      cardLast4: 'cardLast4',
    },
    priority: 8,
  },
  {
    name: 'InstaPay outgoing',
    senderPattern: '/instapay|ipn|cib|nbe|banque|bank/i',
    bodyRegex:
      "(?:InstaPay|IPN).*?(?<amount>[\\d.,\\s]+)\\s*(?<currency>[A-Z]{3}|LE|E£)?.*?(?:to|الى|إلى)\\s+(?<merchant>[\\w\\u0600-\\u06FF .&'\\-]{2,60})",
    captureMap: {amount: 'amount', currency: 'currency', merchant: 'merchant'},
    priority: 9,
  },
  {
    name: 'InstaPay incoming',
    senderPattern: '/instapay|ipn|cib|nbe|banque|bank/i',
    bodyRegex:
      "(?:InstaPay|IPN|you\\s+received|received).*?(?<amount>[\\d.,\\s]+)\\s*(?<currency>[A-Z]{3}|LE|E£)?.*?(?:from|من)\\s+(?<merchant>[\\w\\u0600-\\u06FF .&'\\-]{2,60})",
    captureMap: {amount: 'amount', currency: 'currency', merchant: 'merchant'},
    priority: 9,
  },
  {
    name: 'Purchase at merchant',
    senderPattern: '/bank|card|visa|pos|merchant|alert/i',
    bodyRegex:
      "(?:purchase|txn|transaction)(?:\\s+of)?\\s+(?<amount>[\\d.,\\s]+)\\s*(?<currency>[A-Z]{3}|LE|E£|SR|KD|AED|INR)?\\s+(?:at|@)\\s+(?<merchant>[\\w .&'\\-]{2,60})",
    captureMap: {amount: 'amount', currency: 'currency', merchant: 'merchant'},
    priority: 12,
  },
  {
    name: 'POS / paid / spent',
    senderPattern: '/bank|card|wallet|visa|alert/i',
    bodyRegex:
      "(?:pos|paid|spent|payment|charged)\\s+(?<amount>[\\d.,\\s]+)\\s*(?<currency>[A-Z]{3}|LE|E£|SR|KD|INR)?(?:\\s+(?:at|to|@|for)\\s+(?<merchant>[\\w .&'\\-]{2,60}))?",
    captureMap: {amount: 'amount', currency: 'currency', merchant: 'merchant'},
    priority: 14,
  },
  {
    name: 'ATM withdrawal',
    senderPattern: '/bank|atm|card|alert/i',
    bodyRegex:
      '(?:ATM|cash)\\s*(?:withdrawal|withdraw|wdl)?\\s*(?:of\\s+)?(?<amount>[\\d.,\\s]+)\\s*(?<currency>[A-Z]{3}|LE|E£|SR|KD)?',
    captureMap: {amount: 'amount', currency: 'currency'},
    priority: 11,
  },
  {
    name: 'Outgoing transfer',
    senderPattern: '/bank|wallet|alert|transfer/i',
    bodyRegex:
      "(?:transfer|trf|wire|sent)\\s+(?:of\\s+)?(?<amount>[\\d.,\\s]+)\\s*(?<currency>[A-Z]{3}|LE|E£|SR|KD)?\\s+to\\s+(?<merchant>[\\w .&'\\-]{2,60})",
    captureMap: {amount: 'amount', currency: 'currency', merchant: 'merchant'},
    priority: 13,
  },
  {
    name: 'Incoming transfer',
    senderPattern: '/bank|wallet|alert|transfer/i',
    bodyRegex:
      "(?:received\\s+(?:a\\s+)?transfer|transfer\\s+received|incoming\\s+transfer)\\s+(?:of\\s+)?(?<amount>[\\d.,\\s]+)\\s*(?<currency>[A-Z]{3}|LE|E£|SR|KD)?(?:\\s+from\\s+(?<merchant>[\\w .&'\\-]{2,60}))?",
    captureMap: {amount: 'amount', currency: 'currency', merchant: 'merchant'},
    priority: 13,
  },
  {
    name: 'Credit / deposit / salary',
    senderPattern: '/bank|salary|payroll|alert/i',
    bodyRegex:
      '(?:credited|credit(?:ed)?|deposit(?:ed)?|salary|refund|cashback)\\s+(?:with\\s+)?(?<amount>[\\d.,\\s]+)\\s*(?<currency>[A-Z]{3}|LE|E£|SR|KD)?',
    captureMap: {amount: 'amount', currency: 'currency'},
    priority: 15,
  },
  {
    name: 'Debit of amount',
    senderPattern: '/bank|card|alert/i',
    bodyRegex:
      '(?:debit(?:ed)?|debited)\\s+(?:with\\s+|of\\s+)?(?<amount>[\\d.,\\s]+)\\s*(?<currency>[A-Z]{3}|LE|E£|SR|KD)?',
    captureMap: {amount: 'amount', currency: 'currency'},
    priority: 16,
  },
  {
    name: 'Amount then currency code',
    senderPattern: '/bank|card|wallet|ipn|upi|alert/i',
    bodyRegex:
      '(?<amount>[\\d]{1,3}(?:[ ,.]\\d{3})*(?:[.,]\\d{1,3})?|[\\d]+(?:[.,]\\d{1,3})?)\\s*(?<currency>EGP|USD|EUR|GBP|SAR|AED|KWD|JPY|INR|LE|E£|SR|KD)\\b',
    captureMap: {amount: 'amount', currency: 'currency'},
    priority: 40,
  },
  {
    name: 'Currency then amount',
    senderPattern: '/bank|card|wallet|ipn|upi|alert/i',
    bodyRegex:
      '(?<currency>EGP|USD|EUR|GBP|SAR|AED|KWD|JPY|INR|LE|E£|SR|KD|₹)\\s*(?<amount>[\\d]{1,3}(?:[ ,.]\\d{3})*(?:[.,]\\d{1,3})?|[\\d]+(?:[.,]\\d{1,3})?)',
    captureMap: {amount: 'amount', currency: 'currency'},
    priority: 41,
  },
  {
    name: 'Arabic purchase / debit',
    senderPattern: '/.*/i',
    bodyRegex:
      '(?:شراء|خصم|عملية|مدفوع|تم خصم).*?(?<amount>[\\d.,\\s٠-٩]+)\\s*(?<currency>جنيه|ج\\.م|EGP|LE|ريال|ر\\.س|SAR|درهم|د\\.إ|AED|USD|\\$)?',
    captureMap: {amount: 'amount', currency: 'currency'},
    priority: 10,
  },
  {
    name: 'Arabic outgoing transfer',
    senderPattern: '/.*/i',
    bodyRegex:
      '(?:تحويل|تم تحويل|حولت).*?(?<amount>[\\d.,\\s٠-٩]+)\\s*(?<currency>جنيه|ج\\.م|EGP|LE|ريال|SAR|درهم|AED)?.*?(?:الى|إلى|لـ)\\s*(?<merchant>[\\w\\u0600-\\u06FF .]{2,60})?',
    captureMap: {amount: 'amount', currency: 'currency', merchant: 'merchant'},
    priority: 10,
  },
  {
    name: 'Arabic incoming transfer',
    senderPattern: '/.*/i',
    bodyRegex:
      '(?:تم استلام|استلمت|تحويل وارد).*?(?<amount>[\\d.,\\s٠-٩]+)\\s*(?<currency>جنيه|ج\\.م|EGP|LE|ريال|SAR|درهم|AED)?.*?(?:من)\\s*(?<merchant>[\\w\\u0600-\\u06FF .]{2,60})?',
    captureMap: {amount: 'amount', currency: 'currency', merchant: 'merchant'},
    priority: 10,
  },
  {
    name: 'Arabic credit / deposit',
    senderPattern: '/.*/i',
    bodyRegex:
      '(?:ايداع|إيداع|اضافة|إضافة|تم اضافة|تم إضافة|راتب).*?(?<amount>[\\d.,\\s٠-٩]+)\\s*(?<currency>جنيه|ج\\.م|EGP|LE|ريال|SAR|درهم|AED|USD)?',
    captureMap: {amount: 'amount', currency: 'currency'},
    priority: 11,
  },
  {
    name: 'UPI / IMPS payment',
    senderPattern: '/upi|imps|paytm|gpay|phonepe|sbi|hdfc|icici|axis/i',
    bodyRegex:
      '(?:UPI|IMPS|NEFT).*?(?:Rs\\.?|INR|₹)?\\s*(?<amount>[\\d.,]+)\\s*(?<currency>INR|Rs\\.?|₹)?.*?(?:to|from)?\\s*(?<merchant>[\\w .@-]{2,60})?',
    captureMap: {amount: 'amount', currency: 'currency', merchant: 'merchant'},
    priority: 9,
  },
  {
    name: 'STC Pay / wallet debit',
    senderPattern: '/stc|paypal|vodafone|etisalat|orange|wallet|mada/i',
    bodyRegex:
      '(?:paid|payment|debit|purchase|خصم).*?(?<amount>[\\d.,\\s]+)\\s*(?<currency>SAR|SR|AED|EGP|LE|USD|KWD|KD|INR)?',
    captureMap: {amount: 'amount', currency: 'currency'},
    priority: 12,
  },
  {
    name: 'Generic amount keyword (no balance)',
    senderPattern: '/bank|card|wallet|alert|ipn|upi/i',
    bodyRegex:
      '(?:amount|amt|value|total|sum|مبلغ|قيمة)\\s*[:=\\-]?\\s*(?<amount>[\\d.,\\s٠-٩]+)\\s*(?<currency>[A-Z]{3}|LE|E£|SR|KD|INR|جنيه|ريال)?',
    captureMap: {amount: 'amount', currency: 'currency'},
    priority: 50,
  },
];

/** Built-in rules renamed/replaced in v3 upgrades. */
const V3_RETIRED_NAMES = [
  'Transfer to/from',
  'Arabic transfer',
  'Generic money keyword + amount',
  'InstaPay / IPN payment',
] as const;

const SEED_FLAG = 'seed.sms_rules.v3';

export async function seedSmsRulesIfNeeded(db: SqlDatabase): Promise<void> {
  const stamped = nowIso();
  const flag = await db.execute(`SELECT value FROM settings WHERE key = ?`, [SEED_FLAG]);
  const alreadyV3 = flag.rows.length > 0;

  const existing = await db.execute(`SELECT id, name FROM sms_rules`);
  const existingByName = new Map(
    existing.rows.map(row => [
      String((row as {name?: unknown}).name ?? ''),
      String((row as {id?: unknown}).id ?? ''),
    ]),
  );

  await db.transaction(async tx => {
    if (!alreadyV3) {
      for (const name of V3_RETIRED_NAMES) {
        const id = existingByName.get(name);
        if (id) {
          await tx.execute(
            `UPDATE sms_rules SET enabled = 0, updated_at = ? WHERE id = ? AND default_account_id IS NULL AND default_category_id IS NULL`,
            [stamped, id],
          );
          existingByName.delete(name);
        }
      }
    }

    for (const rule of STARTER_SMS_RULES) {
      const existingId = existingByName.get(rule.name);
      if (existingId) {
        if (!alreadyV3) {
          // Upgrade built-in pattern bodies for installations that still have v2 copies.
          await tx.execute(
            `UPDATE sms_rules SET
              sender_pattern = ?, body_regex = ?, capture_map_json = ?, priority = ?, updated_at = ?
             WHERE id = ? AND default_account_id IS NULL AND default_category_id IS NULL`,
            [
              rule.senderPattern,
              rule.bodyRegex,
              serializeCaptureMap(rule.captureMap),
              rule.priority,
              stamped,
              existingId,
            ],
          );
        }
        continue;
      }
      await tx.execute(
        `INSERT INTO sms_rules (
          id, name, sender_pattern, body_regex, capture_map_json,
          default_account_id, default_category_id, priority, enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, 1, ?, ?)`,
        [
          createId(),
          rule.name,
          rule.senderPattern,
          rule.bodyRegex,
          serializeCaptureMap(rule.captureMap),
          rule.priority,
          stamped,
          stamped,
        ],
      );
    }

    await tx.execute(
      `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
      [SEED_FLAG, '1', stamped],
    );
  });
}
