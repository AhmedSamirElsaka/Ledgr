import {createId, nowIso} from '../id';

describe('createId', () => {
  it('returns UUID v4 shaped ids', () => {
    const id = createId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates unique values', () => {
    const set = new Set(Array.from({length: 50}, () => createId()));
    expect(set.size).toBe(50);
  });
});

describe('nowIso', () => {
  it('returns an ISO timestamp', () => {
    expect(nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
