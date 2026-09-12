import {
  clearUndoDelete,
  getUndoDeleteOffer,
  publishUndoDelete,
  subscribeUndoDelete,
  UNDO_DELETE_MS,
} from '../hooks/undoDeleteBanner';

describe('undoDeleteBanner', () => {
  afterEach(() => {
    clearUndoDelete();
  });

  it('publishes unique ids and notifies subscribers', () => {
    const seen: Array<number | null> = [];
    const unsub = subscribeUndoDelete(offer => {
      seen.push(offer ? offer.count : null);
    });
    publishUndoDelete(['a', 'a', 'b']);
    expect(getUndoDeleteOffer()?.ids).toEqual(['a', 'b']);
    expect(getUndoDeleteOffer()?.count).toBe(2);
    expect(seen.at(-1)).toBe(2);
    clearUndoDelete();
    expect(getUndoDeleteOffer()).toBeNull();
    expect(seen.at(-1)).toBeNull();
    unsub();
  });

  it('exposes a five-second undo window constant', () => {
    expect(UNDO_DELETE_MS).toBe(5000);
  });
});
