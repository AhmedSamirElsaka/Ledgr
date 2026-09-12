import {useEffect, useState, type ReactNode} from 'react';

import {AppState, View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Input} from '../../../design/primitives/Input';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  getAppLockConfig,
  markUnlocked,
  promptBiometric,
  shouldLockNow,
  verifyPin,
} from '../../../lib/appLock';

type Props = {
  children: ReactNode;
};

export function AppLockGate({children}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const [locked, setLocked] = useState(() => shouldLockNow());
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const biometricPrompt = {
    title: t('lock.biometricPromptTitle'),
    subtitle: t('lock.biometricPromptSubtitle'),
    cancel: t('common.cancel'),
  };

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && shouldLockNow()) {
        setLocked(true);
        setPin('');
        setError(undefined);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!locked) {
      return;
    }
    const config = getAppLockConfig();
    if (config.biometricEnabled) {
      setBusy(true);
      promptBiometric(biometricPrompt)
        .then(ok => {
          if (ok) {
            markUnlocked();
            setLocked(false);
          }
        })
        .catch(() => undefined)
        .finally(() => setBusy(false));
    }
    // Prompt strings update with app language after the process restarts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  const config = getAppLockConfig();
  if (!locked || !config.enabled) {
    return <>{children}</>;
  }

  return (
    <ScreenBackdrop washHeight={320}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: theme.space[6],
          gap: theme.space[3],
        }}
        accessibilityViewIsModal>
        <Text variant="title">{t('lock.title')}</Text>
        <Text variant="body" color="secondary">
          {t('lock.subtitle')}
        </Text>
        <Input
          label={t('lock.enterPin')}
          value={pin}
          onChangeText={value => {
            setPin(value);
            setError(undefined);
          }}
          keyboardType="number-pad"
          secureTextEntry
          editable={!busy}
          error={error}
          returnKeyType="done"
        />
        <Button
          label={t('lock.unlock')}
          loading={busy}
          disabled={pin.length < 4}
          onPress={() => {
            setBusy(true);
            setError(undefined);
            verifyPin(pin)
              .then(ok => {
                if (!ok) {
                  setError(t('lock.incorrectPin'));
                  return;
                }
                markUnlocked();
                setLocked(false);
                setError(undefined);
                setPin('');
              })
              .catch(() => setError(t('lock.unlockFailed')))
              .finally(() => setBusy(false));
          }}
          fullWidth
        />
        {config.biometricEnabled ? (
          <Button
            label={t('lock.useBiometrics')}
            variant="secondary"
            disabled={busy}
            onPress={() => {
              setBusy(true);
              setError(undefined);
              promptBiometric(biometricPrompt)
                .then(ok => {
                  if (ok) {
                    markUnlocked();
                    setLocked(false);
                    return;
                  }
                  setError(t('lock.biometricFailed'));
                })
                .catch(() => setError(t('lock.biometricFailed')))
                .finally(() => setBusy(false));
            }}
            fullWidth
          />
        ) : null}
      </View>
    </ScreenBackdrop>
  );
}
