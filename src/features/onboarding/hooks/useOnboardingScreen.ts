import {useState} from 'react';

import {Platform} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';
import {
  getAppLanguage,
  setAppLanguage,
  type AppLanguage,
} from '../../../i18n';
import {
  isValidPin,
  setAppLockEnabled,
  setPin,
} from '../../../lib/appLock';
import {hapticSuccess} from '../../../lib/haptics';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export type OnboardingStep = 0 | 1 | 2 | 3 | 4;

type UseOnboardingScreenOptions = {
  onComplete?: () => void;
};

export function useOnboardingScreen({onComplete}: UseOnboardingScreenOptions = {}) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const repos = useRepos();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [step, setStep] = useState<OnboardingStep>(0);
  const [language, setLanguage] = useState<AppLanguage>(getAppLanguage());
  const [currency, setCurrency] = useState<CurrencyCode>('EGP');
  const [accountName, setAccountName] = useState('Cash');
  const [pin, setPinValue] = useState('');
  const [lockError, setLockError] = useState<string | undefined>();
  const [savingLock, setSavingLock] = useState(false);

  const finish = async () => {
    await repos.settings.set('onboarding.completed', '1');
    hapticSuccess();
    if (onComplete) {
      onComplete();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const onLanguageNext = async () => {
    if (language !== getAppLanguage()) {
      // Restarts for RTL — do not advance step; process will reload.
      await setAppLanguage(language);
      return;
    }
    setStep(1);
  };

  const onCurrencyNext = async () => {
    await repos.settings.set('base_currency', currency);
    setStep(2);
  };

  const onAccountNext = async () => {
    const count = await repos.accounts.countActive();
    if (count === 0) {
      await repos.accounts.create({
        name: accountName.trim() || 'Cash',
        type: 'cash',
        currency,
        openingBalanceMinor: 0,
        color: theme.colors.accent.primary,
        icon: 'Wallet',
      });
    }
    setStep(Platform.OS === 'android' ? 3 : 4);
  };

  const onSmsNext = async () => {
    // SMS / notification permissions are requested later in context
    // (inbox import). Onboarding only explains the optional feature.
    setStep(4);
  };

  const onLockFinish = async () => {
    if (pin.length === 0) {
      await finish();
      return;
    }
    if (!isValidPin(pin)) {
      setLockError(t('onboarding.pinInvalid'));
      return;
    }

    setSavingLock(true);
    setLockError(undefined);
    try {
      const stored = await setPin(pin);
      if (!stored || !(await setAppLockEnabled(true))) {
        setLockError(t('onboarding.pinSaveFailed'));
        return;
      }
      await finish();
    } catch {
      setLockError(t('onboarding.pinSaveFailed'));
    } finally {
      setSavingLock(false);
    }
  };

  const updatePin = (value: string) => {
    setPinValue(value);
    setLockError(undefined);
  };

  const selectCurrency = (code: string) => {
    setCurrency(isCurrencyCode(code) ? code : 'EGP');
  };

  const skipToCurrency = () => setStep(1);
  const skipToAccount = () => setStep(2);
  const skipToLock = () => setStep(Platform.OS === 'android' ? 3 : 4);
  const skipSms = () => setStep(4);

  return {
    step,
    language,
    setLanguage,
    currency,
    accountName,
    pin,
    lockError,
    savingLock,
    setAccountName,
    setPinValue: updatePin,
    selectCurrency,
    onLanguageNext,
    onCurrencyNext,
    onAccountNext,
    onSmsNext,
    onLockFinish,
    finish,
    skipToCurrency,
    skipToAccount,
    skipToLock,
    skipSms,
  };
}
