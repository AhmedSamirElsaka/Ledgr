import {removePref, setPrefString} from '../prefs';
import {
  deleteTransactionTemplate,
  listTransactionTemplates,
  saveTransactionTemplate,
} from '../transactionTemplates';

describe('transactionTemplates', () => {
  beforeEach(() => {
    removePref('templates.transactions');
  });

  it('saves, lists, and deletes templates', () => {
    const saved = saveTransactionTemplate({
      name: 'Coffee',
      type: 'expense',
      amountMinor: 4000,
      currency: 'EGP',
      categoryId: 'cat-1',
      accountId: 'acc-1',
      note: 'Latte',
    });
    expect(listTransactionTemplates()).toEqual([saved]);
    deleteTransactionTemplate(saved.id);
    expect(listTransactionTemplates()).toEqual([]);
  });

  it('ignores corrupt stored JSON', () => {
    setPrefString('templates.transactions', '{not-json');
    expect(listTransactionTemplates()).toEqual([]);
  });
});
