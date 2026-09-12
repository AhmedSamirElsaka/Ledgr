import notifee, {
  AndroidImportance,
  AndroidVisibility,
  RepeatFrequency,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';

import {i18n} from '../i18n';
import {syncSmsNotificationPrivacy} from '../native/smsReceived';

import {
  getPrefBoolean,
  getPrefString,
  removePref,
  setPrefBoolean,
  setPrefString,
} from './prefs';

const CHANNEL_ID = 'ledgr-reminders';
const DAILY_ID = 'daily-streak-reminder';

export type ClockTime = {hour: number; minute: number};

export type NotificationSettings = {
  dailyEnabled: boolean;
  dailyTime: ClockTime;
  subscriptionRemindersEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: ClockTime;
  quietHoursEnd: ClockTime;
  /** When false (default), reminder titles/bodies stay generic on lock screen / shade. */
  lockScreenDetailsEnabled: boolean;
};

const DEFAULT_DAILY: ClockTime = {hour: 20, minute: 0};
const DEFAULT_QUIET_START: ClockTime = {hour: 22, minute: 0};
const DEFAULT_QUIET_END: ClockTime = {hour: 7, minute: 0};

function clampClockPart(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(max, Math.max(0, Math.trunc(value)));
}

export function parseClockTime(
  raw: string | undefined,
  fallback: ClockTime,
): ClockTime {
  if (!raw) {
    return {...fallback};
  }
  const [h, m] = raw.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return {...fallback};
  }
  return {
    hour: clampClockPart(h ?? fallback.hour, 23),
    minute: clampClockPart(m ?? fallback.minute, 59),
  };
}

export function formatClockTime(time: ClockTime): string {
  return `${clampClockPart(time.hour, 23)}:${clampClockPart(time.minute, 59)}`;
}

/** True when `at` falls inside quiet hours (supports overnight windows). */
export function isInQuietHours(
  at: Date,
  start: ClockTime,
  end: ClockTime,
): boolean {
  const minutes = at.getHours() * 60 + at.getMinutes();
  const startMin = start.hour * 60 + start.minute;
  const endMin = end.hour * 60 + end.minute;
  if (startMin === endMin) {
    return false;
  }
  if (startMin < endMin) {
    return minutes >= startMin && minutes < endMin;
  }
  return minutes >= startMin || minutes < endMin;
}

/** Push `at` forward to quiet-hours end when it would fire during quiet hours. */
export function deferPastQuietHours(
  at: Date,
  start: ClockTime,
  end: ClockTime,
): Date {
  if (!isInQuietHours(at, start, end)) {
    return new Date(at.getTime());
  }
  const next = new Date(at.getTime());
  next.setSeconds(0, 0);
  next.setHours(end.hour, end.minute, 0, 0);
  if (next.getTime() <= at.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export type ReminderCopyKind = 'daily' | 'subscription' | 'recurring';

/** Privacy-safe vs richer reminder copy for lock screen / notification shade. */
export function buildReminderCopy(
  kind: ReminderCopyKind,
  options: {
    lockScreenDetailsEnabled: boolean;
    name?: string;
    daysBefore?: number;
  },
): {title: string; body: string} {
  const rich = options.lockScreenDetailsEnabled;
  if (kind === 'daily') {
    return {
      title: i18n.t('notifications.dailyTitle'),
      body: i18n.t('notifications.dailyBody'),
    };
  }
  if (!rich) {
    return {
      title: i18n.t('notifications.privateTitle'),
      body: i18n.t('notifications.privateBody'),
    };
  }
  const name = options.name ?? '';
  const count = options.daysBefore ?? 0;
  if (kind === 'subscription') {
    return {
      title: i18n.t('notifications.subscriptionTitle', {name}),
      body: i18n.t('notifications.subscriptionBody', {count}),
    };
  }
  return {
    title: i18n.t('notifications.recurringTitle', {name}),
    body: i18n.t('notifications.recurringBody', {count}),
  };
}

function androidPrivacyFields(lockScreenDetailsEnabled: boolean) {
  return {
    visibility: lockScreenDetailsEnabled
      ? AndroidVisibility.PRIVATE
      : AndroidVisibility.SECRET,
  } as const;
}

export function getNotificationSettings(): NotificationSettings {
  const dailyTime = parseClockTime(
    getPrefString('notifications.dailyReminder'),
    DEFAULT_DAILY,
  );
  const dailyExplicit = getPrefBoolean('notifications.dailyReminderEnabled');
  const dailyEnabled =
    dailyExplicit === true ||
    (dailyExplicit !== false && getPrefString('notifications.dailyReminder') != null);
  return {
    dailyEnabled,
    dailyTime,
    subscriptionRemindersEnabled:
      getPrefBoolean('notifications.subscriptionRemindersEnabled') !== false,
    quietHoursEnabled: getPrefBoolean('notifications.quietHoursEnabled') === true,
    quietHoursStart: parseClockTime(
      getPrefString('notifications.quietHoursStart'),
      DEFAULT_QUIET_START,
    ),
    quietHoursEnd: parseClockTime(
      getPrefString('notifications.quietHoursEnd'),
      DEFAULT_QUIET_END,
    ),
    lockScreenDetailsEnabled:
      getPrefBoolean('notifications.lockScreenDetailsEnabled') === true,
  };
}

export function setDailyReminderEnabled(enabled: boolean): void {
  setPrefBoolean('notifications.dailyReminderEnabled', enabled);
  if (!enabled) {
    removePref('notifications.dailyReminder');
  }
}

export function setDailyReminderTime(time: ClockTime): void {
  setPrefString('notifications.dailyReminder', formatClockTime(time));
  setPrefBoolean('notifications.dailyReminderEnabled', true);
}

export function setSubscriptionRemindersEnabled(enabled: boolean): void {
  setPrefBoolean('notifications.subscriptionRemindersEnabled', enabled);
}

export function setQuietHoursEnabled(enabled: boolean): void {
  setPrefBoolean('notifications.quietHoursEnabled', enabled);
}

export function setQuietHoursRange(start: ClockTime, end: ClockTime): void {
  setPrefString('notifications.quietHoursStart', formatClockTime(start));
  setPrefString('notifications.quietHoursEnd', formatClockTime(end));
}

export async function setLockScreenDetailsEnabled(enabled: boolean): Promise<void> {
  setPrefBoolean('notifications.lockScreenDetailsEnabled', enabled);
  await syncSmsNotificationPrivacy(enabled);
}

/** Push MMKV privacy preference into Android SharedPreferences (SMS receiver). */
export async function syncNotificationPrivacyToNative(): Promise<void> {
  const settings = getNotificationSettings();
  await syncSmsNotificationPrivacy(settings.lockScreenDetailsEnabled);
}

function applyQuietHoursIfNeeded(fireAt: Date): Date {
  const settings = getNotificationSettings();
  if (!settings.quietHoursEnabled) {
    return fireAt;
  }
  return deferPastQuietHours(
    fireAt,
    settings.quietHoursStart,
    settings.quietHoursEnd,
  );
}

export async function ensureNotificationChannel(): Promise<string> {
  return notifee.createChannel({
    id: CHANNEL_ID,
    name: i18n.t('notifications.channelName'),
    importance: AndroidImportance.DEFAULT,
    visibility: AndroidVisibility.PRIVATE,
  });
}

/** Request POST_NOTIFICATIONS / iOS auth only from an in-context user action. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1;
  } catch {
    return false;
  }
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  const allowed = await requestNotificationPermission();
  if (!allowed) {
    return;
  }
  const channelId = await ensureNotificationChannel();
  await notifee.cancelNotification(DAILY_ID);
  const settings = getNotificationSettings();

  const now = new Date();
  let next = new Date();
  next.setHours(clampClockPart(hour, 23), clampClockPart(minute, 59), 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  next = applyQuietHoursIfNeeded(next);

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: next.getTime(),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  const copy = buildReminderCopy('daily', {
    lockScreenDetailsEnabled: settings.lockScreenDetailsEnabled,
  });

  await notifee.createTriggerNotification(
    {
      id: DAILY_ID,
      title: copy.title,
      body: copy.body,
      android: {
        channelId,
        pressAction: {id: 'default'},
        ...androidPrivacyFields(settings.lockScreenDetailsEnabled),
        actions: [
          {
            title: i18n.t('notifications.dailyAction'),
            pressAction: {id: 'add-expense'},
          },
        ],
      },
    },
    trigger,
  );
  setDailyReminderTime({hour, minute});
}

export async function scheduleSubscriptionReminder(input: {
  id: string;
  name: string;
  dueAtMs: number;
  daysBefore: number;
}): Promise<void> {
  const settings = getNotificationSettings();
  if (!settings.subscriptionRemindersEnabled) {
    return;
  }
  const allowed = await requestNotificationPermission();
  if (!allowed) {
    return;
  }
  const channelId = await ensureNotificationChannel();
  let fireAt = new Date(input.dueAtMs - input.daysBefore * 24 * 60 * 60 * 1000);
  fireAt = applyQuietHoursIfNeeded(fireAt);
  if (fireAt.getTime() <= Date.now()) {
    return;
  }
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: fireAt.getTime(),
  };
  const copy = buildReminderCopy('subscription', {
    lockScreenDetailsEnabled: settings.lockScreenDetailsEnabled,
    name: input.name,
    daysBefore: input.daysBefore,
  });
  await notifee.createTriggerNotification(
    {
      id: `sub-${input.id}`,
      title: copy.title,
      body: copy.body,
      android: {
        channelId,
        pressAction: {id: 'default'},
        ...androidPrivacyFields(settings.lockScreenDetailsEnabled),
      },
    },
    trigger,
  );
}

export async function scheduleRecurringReminder(input: {
  id: string;
  name: string;
  dueAtMs: number;
  daysBefore: number;
}): Promise<void> {
  const allowed = await requestNotificationPermission();
  if (!allowed) {
    return;
  }
  const channelId = await ensureNotificationChannel();
  await notifee.cancelNotification(`recurring-${input.id}`);
  const settings = getNotificationSettings();
  let fireAt = new Date(input.dueAtMs - input.daysBefore * 24 * 60 * 60 * 1000);
  fireAt = applyQuietHoursIfNeeded(fireAt);
  if (fireAt.getTime() <= Date.now()) {
    return;
  }
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: fireAt.getTime(),
  };
  const copy = buildReminderCopy('recurring', {
    lockScreenDetailsEnabled: settings.lockScreenDetailsEnabled,
    name: input.name,
    daysBefore: input.daysBefore,
  });
  await notifee.createTriggerNotification(
    {
      id: `recurring-${input.id}`,
      title: copy.title,
      body: copy.body,
      android: {
        channelId,
        pressAction: {id: 'default'},
        ...androidPrivacyFields(settings.lockScreenDetailsEnabled),
      },
    },
    trigger,
  );
}

export async function cancelRecurringReminder(id: string): Promise<void> {
  await notifee.cancelNotification(`recurring-${id}`);
}

/** @deprecated Prefer getNotificationSettings().dailyTime */
export function getDailyReminderPref(): ClockTime | null {
  const settings = getNotificationSettings();
  if (!settings.dailyEnabled && getPrefString('notifications.dailyReminder') == null) {
    return null;
  }
  return settings.dailyTime;
}

export async function cancelDailyReminder(): Promise<void> {
  await notifee.cancelNotification(DAILY_ID);
  setDailyReminderEnabled(false);
}

export async function syncDailyReminderFromPrefs(): Promise<void> {
  const settings = getNotificationSettings();
  if (!settings.dailyEnabled) {
    await notifee.cancelNotification(DAILY_ID);
    return;
  }
  await scheduleDailyReminder(settings.dailyTime.hour, settings.dailyTime.minute);
}
