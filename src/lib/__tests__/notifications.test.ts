import {
  buildReminderCopy,
  deferPastQuietHours,
  formatClockTime,
  isInQuietHours,
  parseClockTime,
} from '../notifications';

describe('notification clock helpers', () => {
  it('parses and formats clock times', () => {
    expect(parseClockTime('9:5', {hour: 20, minute: 0})).toEqual({
      hour: 9,
      minute: 5,
    });
    expect(parseClockTime('bad', {hour: 20, minute: 0})).toEqual({
      hour: 20,
      minute: 0,
    });
    expect(formatClockTime({hour: 7, minute: 30})).toBe('7:30');
  });

  it('detects quiet hours including overnight windows', () => {
    const start = {hour: 22, minute: 0};
    const end = {hour: 7, minute: 0};
    expect(isInQuietHours(new Date(2026, 0, 1, 23, 0), start, end)).toBe(true);
    expect(isInQuietHours(new Date(2026, 0, 1, 3, 0), start, end)).toBe(true);
    expect(isInQuietHours(new Date(2026, 0, 1, 12, 0), start, end)).toBe(false);
  });

  it('defers fire times past quiet hours end', () => {
    const start = {hour: 22, minute: 0};
    const end = {hour: 7, minute: 0};
    const deferred = deferPastQuietHours(new Date(2026, 0, 1, 23, 15), start, end);
    expect(deferred.getHours()).toBe(7);
    expect(deferred.getMinutes()).toBe(0);
    expect(deferred.getDate()).toBe(2);
  });
});

describe('notification privacy copy', () => {
  it('redacts subscription and recurring names by default', () => {
    const sub = buildReminderCopy('subscription', {
      lockScreenDetailsEnabled: false,
      name: 'Netflix',
      daysBefore: 2,
    });
    expect(sub.title).not.toContain('Netflix');
    expect(sub.body).not.toContain('Netflix');

    const recurring = buildReminderCopy('recurring', {
      lockScreenDetailsEnabled: false,
      name: 'Rent',
      daysBefore: 3,
    });
    expect(recurring.title).not.toContain('Rent');
  });

  it('includes names when lock-screen details are enabled', () => {
    const sub = buildReminderCopy('subscription', {
      lockScreenDetailsEnabled: true,
      name: 'Netflix',
      daysBefore: 2,
    });
    expect(sub.title).toContain('Netflix');
    expect(sub.body).toContain('2');
  });

  it('keeps daily reminder copy generic either way', () => {
    const redacted = buildReminderCopy('daily', {
      lockScreenDetailsEnabled: false,
    });
    const rich = buildReminderCopy('daily', {
      lockScreenDetailsEnabled: true,
    });
    expect(redacted.title).toBe(rich.title);
    expect(redacted.body).toBe(rich.body);
  });
});
