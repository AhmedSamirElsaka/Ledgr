import i18next from 'i18next';
import {initReactI18next} from 'react-i18next';

import {getPrefString, setPrefString} from '../lib/prefs';

import {
  applyLayoutDirection,
  ensureLayoutDirection,
  isRtlLanguage,
} from './layoutDirection';
import {ar} from './locales/ar';
import {en} from './locales/en';
import {restartApp} from './restart';

/* i18next default instance exposes use/changeLanguage — not the named exports. */
/* eslint-disable import/no-named-as-default-member */

const resources = {
  en: {translation: en},
  ar: {translation: ar},
} as const;

export type AppLanguage = keyof typeof resources;

function detectDeviceLanguage(): AppLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
    return locale.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

function loadInitialLanguage(): AppLanguage {
  const stored = getPrefString('i18n.language');
  if (stored === 'en' || stored === 'ar') {
    return stored;
  }
  return detectDeviceLanguage();
}

const initialLanguage = loadInitialLanguage();
ensureLayoutDirection(initialLanguage);

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {escapeValue: false},
    compatibilityJSON: 'v4',
  })
  .catch(() => undefined);

/**
 * Persist language, apply RTL/LTR, then restart so native layout direction flips.
 * Always restarts when switching between en and ar (direction always differs).
 */
export async function setAppLanguage(language: AppLanguage): Promise<void> {
  const previous = getAppLanguage();
  if (previous === language) {
    return;
  }

  setPrefString('i18n.language', language);
  await i18next.changeLanguage(language);
  applyLayoutDirection(language);

  // Native forceRTL only applies after a full process restart.
  // Defer so MMKV + alert dismissal finish before reload.
  setTimeout(() => {
    restartApp();
  }, 80);
}

export function getAppLanguage(): AppLanguage {
  const lng = i18next.language;
  return lng.startsWith('ar') ? 'ar' : 'en';
}

export {i18next as i18n, isRtlLanguage};
