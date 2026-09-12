import {parseSaveForm, type SaveFormState} from '../hooks/addTransactionSaveUtils';

function form(partial: Partial<SaveFormState> = {}): SaveFormState {
  return {
    type: 'expense',
    amountMinor: 2500,
    accountId: 'acc-1',
    toAccountId: null,
    categoryId: 'cat-1',
    note: '  latte  ',
    occurredAt: '2026-03-12T10:00:00.000Z',
    currency: 'EGP',
    baseCurrency: 'EGP',
    selectedTagIds: [],
    receipt: {
      storedRelativePath: null,
      pendingSourceUri: null,
      pendingMimeType: null,
      removed: false,
    },
    ...partial,
  };
}

describe('parseSaveForm', () => {
  it('trims notes and maps null account to empty string for zod', () => {
    const parsed = parseSaveForm(form());
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.note).toBe('latte');
      expect(parsed.data.accountId).toBe('acc-1');
    }
  });

  it('fails when account is missing', () => {
    const parsed = parseSaveForm(form({accountId: null}));
    expect(parsed.success).toBe(false);
  });

  it('accepts a transfer with destination', () => {
    const parsed = parseSaveForm(
      form({
        type: 'transfer',
        categoryId: null,
        toAccountId: 'acc-2',
        note: '',
      }),
    );
    expect(parsed.success).toBe(true);
  });
});
