import {createMMKV} from 'react-native-mmkv';

const storage = createMMKV({id: 'ledgr-prefs'});

export type PrefKey =
  | 'ui.period'
  | 'ui.lastTab'
  | 'onboarding.cashPromptDismissed'
  | string;

export function getPrefString(key: PrefKey): string | undefined {
  return storage.getString(key);
}

export function setPrefString(key: PrefKey, value: string): void {
  storage.set(key, value);
}

export function getPrefBoolean(key: PrefKey): boolean | undefined {
  return storage.getBoolean(key);
}

export function setPrefBoolean(key: PrefKey, value: boolean): void {
  storage.set(key, value);
}

export function removePref(key: PrefKey): void {
  storage.remove(key);
}

export function getPrefNumber(key: PrefKey): number | undefined {
  return storage.getNumber(key);
}

export function setPrefNumber(key: PrefKey, value: number): void {
  storage.set(key, value);
}
