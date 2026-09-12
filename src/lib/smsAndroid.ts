import {PermissionsAndroid, Platform} from 'react-native';

import {requestNotificationPermission} from './notifications';

export type DeviceSms = {
  address: string;
  body: string;
  date: number;
  _id?: string;
};

export type SmsImportPeriod = {
  /** Inclusive start (ms since epoch). */
  minDateMs: number;
  /** Inclusive end (ms since epoch). Defaults to now when omitted. */
  maxDateMs?: number;
  /** Soft cap on messages returned by the native reader. */
  maxCount?: number;
};

/**
 * Android SMS inbox backfill via react-native-get-sms-android.
 * Real-time RECEIVE_SMS: custom `SmsReceiver` + `LedgrSmsReceived`
 * native module queues to SharedPreferences and emits to JS (`src/native/smsReceived.ts`).
 *
 * Call only from an in-context user action (inbox import / explicit enable) —
 * never from cold start.
 */
export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  ]);
  const readOk =
    result[PermissionsAndroid.PERMISSIONS.READ_SMS] ===
    PermissionsAndroid.RESULTS.GRANTED;
  // RECEIVE_SMS is requested in the same prompt for live queueing; inbox import
  // only requires READ_SMS (some devices grant the SMS group together).
  return readOk;
}

/**
 * After SMS is enabled, optionally prompt for notifications so review alerts work.
 * Still in-context (import / enable), never cold start.
 */
export async function requestSmsReviewNotificationPermission(): Promise<boolean> {
  return requestNotificationPermission();
}

/** Convenience: last N calendar days through now. */
export function periodLastDays(days: number): SmsImportPeriod {
  const maxDateMs = Date.now();
  return {
    minDateMs: maxDateMs - days * 24 * 60 * 60 * 1000,
    maxDateMs,
  };
}

export async function listInboxSms(
  daysOrPeriod: number | SmsImportPeriod,
): Promise<DeviceSms[]> {
  if (Platform.OS !== 'android') {
    return [];
  }

  const period: SmsImportPeriod =
    typeof daysOrPeriod === 'number' ? periodLastDays(daysOrPeriod) : daysOrPeriod;

  // Lazy require so Jest / iOS never loads the native module eagerly.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SmsAndroid = require('react-native-get-sms-android') as {
    list: (
      filter: string,
      fail: (err: string) => void,
      success: (count: number, smsList: string) => void,
    ) => void;
  };

  const filter = JSON.stringify({
    box: 'inbox',
    minDate: period.minDateMs,
    maxDate: period.maxDateMs ?? Date.now(),
    maxCount: period.maxCount ?? 1000,
  });

  return new Promise(resolve => {
    SmsAndroid.list(
      filter,
      () => resolve([]),
      (_count, smsList) => {
        try {
          const parsed = JSON.parse(smsList) as DeviceSms[];
          resolve(Array.isArray(parsed) ? parsed : []);
        } catch {
          resolve([]);
        }
      },
    );
  });
}
