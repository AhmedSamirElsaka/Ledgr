import {DevSettings, NativeModules} from 'react-native';

import RNRestart from 'react-native-restart';

/**
 * Full native reload so I18nManager.forceRTL takes effect.
 * Prefer react-native-restart; fall back to DevSettings in debug if unlinked.
 */
export function restartApp(): void {
  try {
    if (typeof RNRestart.restart === 'function') {
      RNRestart.restart('language-rtl');
      return;
    }
    if (typeof RNRestart.Restart === 'function') {
      RNRestart.Restart('language-rtl');
      return;
    }
  } catch {
    // Fall through to DevSettings.
  }

  if (typeof DevSettings?.reload === 'function') {
    DevSettings.reload();
    return;
  }

  // Last resort: some builds expose reload on NativeModules.
  const settings = NativeModules.DevSettings as {reload?: () => void} | undefined;
  settings?.reload?.();
}
