import {I18nManager} from 'react-native';

import {getPrefBoolean, removePref, setPrefBoolean} from '../lib/prefs';

import {restartApp} from './restart';

export function isRtlLanguage(language: string): boolean {
  return language.startsWith('ar');
}

export function applyLayoutDirection(language: string): void {
  const isRtl = isRtlLanguage(language);
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(isRtl);
}

/**
 * Native RTL only applies after a reload. Sync and restart once so the first
 * interactive screen matches the selected language.
 */
export function ensureLayoutDirection(language: string): void {
  const shouldBeRtl = isRtlLanguage(language);
  applyLayoutDirection(language);

  if (I18nManager.isRTL === shouldBeRtl) {
    removePref('i18n.rtlSyncPending');
    return;
  }

  if (getPrefBoolean('i18n.rtlSyncPending') === true) {
    removePref('i18n.rtlSyncPending');
    return;
  }

  setPrefBoolean('i18n.rtlSyncPending', true);
  restartApp();
}
