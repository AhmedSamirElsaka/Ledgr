import {I18nManager} from 'react-native';

import {useTranslation} from 'react-i18next';

/** Text alignment for inputs that should flip with RTL. */
export function useTextInputAlign(): 'left' | 'right' {
  const {i18n} = useTranslation();
  const rtl = i18n.language.startsWith('ar') || I18nManager.isRTL;
  return rtl ? 'right' : 'left';
}

export function useIsRtl(): boolean {
  const {i18n} = useTranslation();
  return i18n.language.startsWith('ar') || I18nManager.isRTL;
}
