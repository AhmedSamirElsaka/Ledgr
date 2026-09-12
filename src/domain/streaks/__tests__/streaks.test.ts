import {calcTrackingStreak} from '../streaks';

describe('calcTrackingStreak', () => {
  const today = new Date('2026-09-10T12:00:00.000Z');

  it('returns 0 for empty history', () => {
    expect(calcTrackingStreak([], today)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const dates = [
      '2026-09-10T08:00:00.000Z',
      '2026-09-09T18:00:00.000Z',
      '2026-09-08T10:00:00.000Z',
    ];
    expect(calcTrackingStreak(dates, today)).toBe(3);
  });

  it('allows streak to start from yesterday', () => {
    const dates = ['2026-09-09T18:00:00.000Z', '2026-09-08T10:00:00.000Z'];
    expect(calcTrackingStreak(dates, today)).toBe(2);
  });

  it('breaks on a missing day', () => {
    const dates = [
      '2026-09-10T08:00:00.000Z',
      '2026-09-08T10:00:00.000Z',
    ];
    expect(calcTrackingStreak(dates, today)).toBe(1);
  });

  it('returns 0 when last activity is older than yesterday', () => {
    expect(calcTrackingStreak(['2026-09-07T10:00:00.000Z'], today)).toBe(0);
  });
});
