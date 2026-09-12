/**
 * Generic bank/wallet SMS fixtures — pattern-based, not invented bank formats.
 */

export type SmsFixture = {
  id: string;
  sender: string;
  body: string;
  receivedAt: string;
  expectedRuleId: string;
  expectedAmountMinor: number;
  expectedMerchant?: string;
  expectedType?: 'expense' | 'income' | 'transfer';
  expectedCardLast4?: string;
};

export const SMS_FIXTURES: SmsFixture[] = [
  {
    id: 'purchase',
    sender: 'BANK-ALERT',
    body: 'Purchase of 150.00 EGP at COFFEE HOUSE on 10-Sep. Available balance 2,000.00 EGP.',
    receivedAt: '2026-09-10T10:00:00.000Z',
    expectedRuleId: 'r-purchase',
    expectedAmountMinor: 15000,
    expectedMerchant: 'Coffee House',
    expectedType: 'expense',
  },
  {
    id: 'withdrawal',
    sender: 'BANK-ALERT',
    body: 'ATM withdrawal 500.00 EGP successful. Fee 5.00 EGP.',
    receivedAt: '2026-09-10T11:00:00.000Z',
    expectedRuleId: 'r-withdraw',
    expectedAmountMinor: 50000,
    expectedType: 'expense',
  },
  {
    id: 'transfer',
    sender: 'WALLET-EG',
    body: 'Transfer of 250.50 EGP to Ali Hassan completed.',
    receivedAt: '2026-09-10T12:00:00.000Z',
    expectedRuleId: 'r-transfer',
    expectedAmountMinor: 25050,
    expectedMerchant: 'Ali Hassan',
    expectedType: 'expense',
  },
  {
    id: 'credit',
    sender: 'BANK-ALERT',
    body: 'Your account was credited 8,000.00 EGP salary deposit REF:AB99.',
    receivedAt: '2026-09-10T13:00:00.000Z',
    expectedRuleId: 'r-credit',
    expectedAmountMinor: 800000,
    expectedType: 'income',
  },
  {
    id: 'instapay',
    sender: 'IPN-NOTIFY',
    body: 'InstaPay-style payment 75.25 EGP to Grocery Mart received confirmation.',
    receivedAt: '2026-09-10T14:00:00.000Z',
    expectedRuleId: 'r-instapay',
    expectedAmountMinor: 7525,
    expectedMerchant: 'Grocery Mart',
    expectedType: 'expense',
  },
  {
    id: 'card-ending',
    sender: 'CARD-SVC',
    body: 'Card ending 1234 purchase 42.00 USD at BOOK STORE completed.',
    receivedAt: '2026-09-10T15:00:00.000Z',
    expectedRuleId: 'r-card',
    expectedAmountMinor: 4200,
    expectedMerchant: 'Book Store',
    expectedCardLast4: '1234',
    expectedType: 'expense',
  },
];
