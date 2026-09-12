import {parseYmd, SMS_INBOX_PERIOD_CHOICES} from '../hooks/smsInboxPeriod';

describe('parseYmd', () => {
  it('parses valid yyyy-MM-dd', () => {
    const d = parseYmd('2026-03-12');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(2);
    expect(d!.getDate()).toBe(12);
  });

  it('rejects malformed strings', () => {
    expect(parseYmd('')).toBeNull();
    expect(parseYmd('12-03-2026')).toBeNull();
    expect(parseYmd('2026-13-01')).toBeNull();
    expect(parseYmd('not-a-date')).toBeNull();
  });
});

describe('SMS_INBOX_PERIOD_CHOICES', () => {
  it('includes the common day windows', () => {
    expect(SMS_INBOX_PERIOD_CHOICES.map(c => c.days)).toEqual([7, 14, 30, 90, 180]);
  });
});
