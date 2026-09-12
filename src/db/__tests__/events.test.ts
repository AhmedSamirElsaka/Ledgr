import {emitDbChange, subscribeTable} from '../events';

describe('db change events', () => {
  it('notifies table subscribers and supports unsubscribe', () => {
    const seen: string[] = [];
    const unsubscribe = subscribeTable('transactions', () => {
      seen.push('tx');
    });

    emitDbChange({table: 'accounts'});
    emitDbChange({table: 'transactions'});
    unsubscribe();
    emitDbChange({table: 'transactions'});

    expect(seen).toEqual(['tx']);
  });
});
