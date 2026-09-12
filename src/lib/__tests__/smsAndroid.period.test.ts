import {periodLastDays} from '../smsAndroid';

describe('periodLastDays', () => {
  it('builds an inclusive window ending at now', () => {
    const before = Date.now();
    const period = periodLastDays(7);
    const after = Date.now();

    expect(period.maxDateMs).toBeGreaterThanOrEqual(before);
    expect(period.maxDateMs).toBeLessThanOrEqual(after);
    expect(period.minDateMs).toBe(period.maxDateMs! - 7 * 24 * 60 * 60 * 1000);
  });
});
