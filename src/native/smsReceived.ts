import {NativeEventEmitter, NativeModules, Platform} from 'react-native';

import {
  hasTransactionalSignal,
  isBalanceOnlySms,
  isNonTransactionalSms,
  isPromoOrLimitSms,
} from '../domain/sms/ruleEngine';

export type PendingSms = {
  sender: string;
  body: string;
  receivedAt: number;
};

type SmsReceivedNative = {
  drainPending: () => Promise<PendingSms[]>;
  setLockScreenDetailsEnabled?: (enabled: boolean) => Promise<null>;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

const Native: SmsReceivedNative | undefined =
  Platform.OS === 'android'
    ? (NativeModules.LedgrSmsReceived as SmsReceivedNative | undefined)
    : undefined;

/** Shared with domain classifier — only surface money-movement SMS. */
export function looksLikeTransactionSms(body: string): boolean {
  if (isNonTransactionalSms(body) || isPromoOrLimitSms(body) || isBalanceOnlySms(body)) {
    return false;
  }
  return hasTransactionalSignal(body);
}

/**
 * Android SMS_RECEIVED bridge: drains SharedPreferences queue + live events.
 * No-op on iOS / when the native module is missing.
 */
export async function drainPendingSms(): Promise<PendingSms[]> {
  if (!Native?.drainPending) {
    return [];
  }
  try {
    const rows = await Native.drainPending();
    const list = Array.isArray(rows) ? rows : [];
    return list.filter(sms => looksLikeTransactionSms(sms.body ?? ''));
  } catch {
    return [];
  }
}

/** Sync lock-screen detail opt-in into Android SharedPreferences for SmsReceiver. */
export async function syncSmsNotificationPrivacy(
  lockScreenDetailsEnabled: boolean,
): Promise<void> {
  if (!Native?.setLockScreenDetailsEnabled) {
    return;
  }
  try {
    await Native.setLockScreenDetailsEnabled(lockScreenDetailsEnabled);
  } catch {
    // Pref stays in MMKV; native falls back to redacted default.
  }
}

export function subscribeIncomingSms(
  listener: (sms: PendingSms) => void,
): () => void {
  if (!Native) {
    return () => undefined;
  }
  const emitter = new NativeEventEmitter(NativeModules.LedgrSmsReceived);
  const sub = emitter.addListener('ledgrSmsReceived', (...args: unknown[]) => {
    const payload = args[0] as PendingSms;
    if (payload && typeof payload === 'object') {
      if (!looksLikeTransactionSms(payload.body ?? '')) {
        return;
      }
      listener(payload);
    }
  });
  return () => sub.remove();
}
