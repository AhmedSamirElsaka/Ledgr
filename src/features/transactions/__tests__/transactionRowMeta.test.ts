import {
  buildTransactionRowMeta,
  transactionRowTitle,
  transactionSourceLabel,
} from '../hooks/transactionRowMeta';

const labels = {
  typeExpense: 'Expense',
  typeIncome: 'Income',
  typeTransfer: 'Transfer',
  sourceSms: 'SMS',
  sourceRecurring: 'Recurring',
  sourceImport: 'Import',
};

describe('transactionRowMeta', () => {
  it('includes type, non-manual source, tags, and note when merchant is title', () => {
    const meta = buildTransactionRowMeta(
      {
        type: 'expense',
        source: 'sms',
        merchant: 'Cafe',
        note: 'Latte',
      },
      ['Work', 'Tax'],
      labels,
    );
    expect(meta).toBe('Expense · SMS · Work, Tax · Latte');
  });

  it('omits manual source and note when note is already the title', () => {
    const meta = buildTransactionRowMeta(
      {
        type: 'income',
        source: 'manual',
        merchant: null,
        note: 'Salary',
      },
      [],
      labels,
    );
    expect(meta).toBe('Income');
  });

  it('maps sources and titles', () => {
    expect(transactionSourceLabel('import', labels)).toBe('Import');
    expect(transactionSourceLabel('recurring', labels)).toBe('Recurring');
    expect(transactionSourceLabel('manual', labels)).toBeNull();
    expect(
      transactionRowTitle({type: 'transfer', merchant: null, note: null}, labels),
    ).toBe('Transfer');
  });

  it('labels recurring-sourced expenses in the meta line', () => {
    const meta = buildTransactionRowMeta(
      {
        type: 'expense',
        source: 'recurring',
        merchant: 'Rent',
        note: null,
      },
      [],
      labels,
    );
    expect(meta).toBe('Expense · Recurring');
  });
});
