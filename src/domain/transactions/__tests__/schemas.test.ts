import {addTransactionSchema} from '../schemas';

describe('addTransactionSchema', () => {
  const base = {
    amountMinor: 1500,
    accountId: 'acc-1',
    occurredAt: '2026-03-12T10:00:00.000Z',
  };

  it('accepts a valid expense with category', () => {
    const parsed = addTransactionSchema.safeParse({
      ...base,
      type: 'expense',
      categoryId: 'cat-1',
      note: 'Coffee',
    });
    expect(parsed.success).toBe(true);
  });

  it('requires category for expense and income', () => {
    const expense = addTransactionSchema.safeParse({
      ...base,
      type: 'expense',
      categoryId: null,
    });
    expect(expense.success).toBe(false);
    if (!expense.success) {
      expect(expense.error.issues[0]?.message).toBe('add.validationCategory');
    }

    const income = addTransactionSchema.safeParse({
      ...base,
      type: 'income',
    });
    expect(income.success).toBe(false);
  });

  it('requires a different destination account for transfers', () => {
    const missing = addTransactionSchema.safeParse({
      ...base,
      type: 'transfer',
    });
    expect(missing.success).toBe(false);
    if (!missing.success) {
      expect(missing.error.issues[0]?.message).toBe('add.validationDestination');
    }

    const same = addTransactionSchema.safeParse({
      ...base,
      type: 'transfer',
      toAccountId: 'acc-1',
    });
    expect(same.success).toBe(false);
    if (!same.success) {
      expect(same.error.issues.some(i => i.message === 'add.validationAccountsDiffer')).toBe(
        true,
      );
    }

    const ok = addTransactionSchema.safeParse({
      ...base,
      type: 'transfer',
      toAccountId: 'acc-2',
    });
    expect(ok.success).toBe(true);
  });

  it('rejects non-positive amounts', () => {
    const parsed = addTransactionSchema.safeParse({
      ...base,
      type: 'expense',
      categoryId: 'cat-1',
      amountMinor: 0,
    });
    expect(parsed.success).toBe(false);
  });
});
