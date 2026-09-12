import {
  buildIgnoreSimilarPattern,
  matchesIgnoreSimilar,
  parseIgnoredSimilarSetting,
  serializeIgnoredSimilarSetting,
  upsertIgnoreSimilarPattern,
} from '../ignoreSimilar';

describe('ignoreSimilar', () => {
  it('normalizes and builds a sender+merchant pattern', () => {
    expect(
      buildIgnoreSimilarPattern({sender: '  cibeg ', merchant: ' Uber Eats '}),
    ).toEqual({sender: 'CIBEG', merchant: 'uber eats'});
  });

  it('matches sender-only patterns against any merchant', () => {
    const patterns = [{sender: 'CIBEG', merchant: null}];
    expect(matchesIgnoreSimilar(patterns, {sender: 'cibeg', merchant: 'Starbucks'})).toBe(
      true,
    );
    expect(matchesIgnoreSimilar(patterns, {sender: 'CIBEG'})).toBe(true);
    expect(matchesIgnoreSimilar(patterns, {sender: 'NBE'})).toBe(false);
  });

  it('matches merchant-specific patterns only when merchant agrees', () => {
    const patterns = [{sender: 'CIBEG', merchant: 'uber'}];
    expect(matchesIgnoreSimilar(patterns, {sender: 'CIBEG', merchant: 'Uber'})).toBe(true);
    expect(matchesIgnoreSimilar(patterns, {sender: 'CIBEG', merchant: 'Starbucks'})).toBe(
      false,
    );
    expect(matchesIgnoreSimilar(patterns, {sender: 'CIBEG'})).toBe(false);
  });

  it('upserts broader sender-only over specifics and skips duplicates', () => {
    const withSpecific = upsertIgnoreSimilarPattern([], {
      sender: 'CIBEG',
      merchant: 'uber',
    });
    expect(withSpecific).toEqual([{sender: 'CIBEG', merchant: 'uber'}]);

    const broader = upsertIgnoreSimilarPattern(withSpecific, {
      sender: 'CIBEG',
      merchant: null,
    });
    expect(broader).toEqual([{sender: 'CIBEG', merchant: null}]);

    const specificAfterBroad = upsertIgnoreSimilarPattern(broader, {
      sender: 'CIBEG',
      merchant: 'uber',
    });
    expect(specificAfterBroad).toEqual([{sender: 'CIBEG', merchant: null}]);

    expect(
      upsertIgnoreSimilarPattern(broader, {sender: 'CIBEG', merchant: null}),
    ).toEqual(broader);
  });

  it('round-trips JSON settings and drops invalid rows', () => {
    const patterns = [
      {sender: 'CIBEG', merchant: 'uber'},
      {sender: 'NBE', merchant: null},
    ];
    const raw = serializeIgnoredSimilarSetting(patterns);
    expect(parseIgnoredSimilarSetting(raw)).toEqual(patterns);
    expect(parseIgnoredSimilarSetting(null)).toEqual([]);
    expect(parseIgnoredSimilarSetting('{')).toEqual([]);
    expect(parseIgnoredSimilarSetting(JSON.stringify([{sender: 1}, {sender: 'OK'}]))).toEqual([
      {sender: 'OK', merchant: null},
    ]);
  });
});
