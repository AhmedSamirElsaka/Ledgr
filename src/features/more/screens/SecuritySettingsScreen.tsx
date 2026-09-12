import {useState} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {FormSection} from '../../../design/primitives/FormSection';
import {Input} from '../../../design/primitives/Input';
import {
  clearPin,
  getAppLockConfig,
  isValidPin,
  setAppLockEnabled,
  setAutoLockSeconds,
  setBiometricEnabled,
  setPin,
} from '../../../lib/appLock';
import {hapticSuccess} from '../../../lib/haptics';
import {MoreStackChrome} from '../components/MoreStackChrome';

export function SecuritySettingsScreen() {
  const {t} = useTranslation();
  const config = getAppLockConfig();
  const [pin, setPinValue] = useState('');
  const [autoLock, setAutoLock] = useState(String(config.autoLockSeconds));
  const [enabled, setEnabled] = useState(config.enabled);
  const [biometric, setBiometric] = useState(config.biometricEnabled);
  const [lockError, setLockError] = useState<string | undefined>();
  const [savingLock, setSavingLock] = useState(false);

  const biometricPrompt = {
    title: t('lock.biometricPromptTitle'),
    subtitle: t('lock.biometricPromptSubtitle'),
    cancel: t('common.cancel'),
  };

  return (
    <MoreStackChrome>
      <FormSection title={t('security.appLock')} description={t('security.body')}>
        <Button
          label={enabled ? t('security.lockEnabled') : t('security.lockDisabled')}
          variant={enabled ? 'primary' : 'secondary'}
          disabled={savingLock}
          onPress={() => {
            const next = !enabled;
            setSavingLock(true);
            setLockError(undefined);
            setAppLockEnabled(next)
              .then(ok => {
                if (!ok) {
                  setLockError(t('security.pinRequired'));
                  return;
                }
                setEnabled(next);
                if (!next) {
                  hapticSuccess();
                }
              })
              .catch(() => setLockError(t('security.lockSaveFailed')))
              .finally(() => setSavingLock(false));
          }}
          fullWidth
        />
        <Button
          label={biometric ? t('security.biometricsOn') : t('security.biometricsOff')}
          variant={biometric ? 'primary' : 'secondary'}
          disabled={savingLock || !config.hasPin}
          onPress={() => {
            const next = !biometric;
            setSavingLock(true);
            setLockError(undefined);
            setBiometricEnabled(next, biometricPrompt)
              .then(ok => {
                if (!ok) {
                  setLockError(t('security.biometricsUnavailable'));
                  return;
                }
                setBiometric(next);
                hapticSuccess();
              })
              .catch(() => setLockError(t('security.biometricsUnavailable')))
              .finally(() => setSavingLock(false));
          }}
          fullWidth
        />
        <Input
          label={t('security.newPin')}
          value={pin}
          onChangeText={value => {
            setPinValue(value);
            setLockError(undefined);
          }}
          keyboardType="number-pad"
          secureTextEntry
          editable={!savingLock}
          error={lockError}
        />
        <Input
          label={t('security.autoLockSeconds')}
          value={autoLock}
          onChangeText={setAutoLock}
          keyboardType="number-pad"
          editable={!savingLock}
        />
        <Button
          label={t('security.saveLock')}
          loading={savingLock}
          onPress={() => {
            if (pin.length > 0 && !isValidPin(pin)) {
              setLockError(t('security.pinInvalid'));
              return;
            }
            if (pin.length === 0 && !config.hasPin) {
              setLockError(t('security.pinRequired'));
              return;
            }

            setSavingLock(true);
            setLockError(undefined);
            setAutoLockSeconds(Number(autoLock) || 60);
            const savePin = pin.length > 0 ? setPin(pin) : Promise.resolve(true);
            savePin
              .then(async stored => {
                if (!stored || !(await setAppLockEnabled(true))) {
                  setLockError(t('security.lockSaveFailed'));
                  return;
                }
                setEnabled(true);
                setPinValue('');
                hapticSuccess();
                Alert.alert(t('security.lockSaved'));
              })
              .catch(() => setLockError(t('security.lockSaveFailed')))
              .finally(() => setSavingLock(false));
          }}
          fullWidth
        />
        <Button
          label={t('security.clearPin')}
          variant="secondary"
          disabled={savingLock || !config.hasPin}
          onPress={() => {
            setSavingLock(true);
            clearPin()
              .then(() => {
                setEnabled(false);
                setBiometric(false);
                setPinValue('');
                setLockError(undefined);
                Alert.alert(t('security.pinCleared'));
              })
              .catch(() => setLockError(t('security.clearPinFailed')))
              .finally(() => setSavingLock(false));
          }}
          fullWidth
        />
      </FormSection>
    </MoreStackChrome>
  );
}
