import {Platform, ScrollView, View} from 'react-native';

import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Button} from '../../../design/primitives/Button';
import {Card} from '../../../design/primitives/Card';
import {Input} from '../../../design/primitives/Input';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {CURRENCIES, type CurrencyCode} from '../../../domain/money/Money';
import {type AppLanguage} from '../../../i18n';
import {OnboardingHero} from '../components/OnboardingHero';
import {useOnboardingScreen} from '../hooks/useOnboardingScreen';

const CURRENCY_OPTIONS = Object.keys(CURRENCIES) as CurrencyCode[];
const LANGUAGE_OPTIONS: AppLanguage[] = ['en', 'ar'];

type Props = {
  onComplete?: () => void;
};

export function OnboardingScreen({onComplete}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const {
    step,
    language,
    setLanguage,
    currency,
    accountName,
    pin,
    lockError,
    savingLock,
    setAccountName,
    setPinValue,
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
  } = useOnboardingScreen({onComplete});

  return (
    <ScreenBackdrop washHeight={340}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          paddingTop: insets.top + theme.space[6],
          paddingHorizontal: theme.space[4],
          paddingBottom: insets.bottom + theme.space[8],
          gap: theme.space[5],
        }}>
        <OnboardingHero />
        <View style={{gap: theme.space[2]}}>
          <Text variant="label" color="tertiary">
            {t('common.brand')}
          </Text>
          <Text variant="display">{t('onboarding.title')}</Text>
          <Text variant="body" color="secondary">
            {t('onboarding.subtitle')}
          </Text>
        </View>

        {step === 0 ? (
          <Card>
            <Text variant="headline">{t('onboarding.languageTitle')}</Text>
            <Text variant="body" color="secondary" style={{marginTop: theme.space[2]}}>
              {t('onboarding.languageBody')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: theme.space[2],
                marginTop: theme.space[3],
              }}>
              {LANGUAGE_OPTIONS.map(option => (
                <Button
                  key={option}
                  label={option === 'en' ? t('language.en') : t('language.ar')}
                  variant={language === option ? 'primary' : 'secondary'}
                  onPress={() => setLanguage(option)}
                />
              ))}
            </View>
            <View style={{height: theme.space[3]}} />
            <Button
              label={t('common.continue')}
              onPress={() => {
                onLanguageNext().catch(() => undefined);
              }}
              fullWidth
              size="lg"
            />
            <Button
              label={t('common.skip')}
              variant="ghost"
              onPress={skipToCurrency}
              fullWidth
            />
          </Card>
        ) : null}

        {step === 1 ? (
          <Card>
            <Text variant="headline">{t('onboarding.currencyTitle')}</Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: theme.space[2],
                marginTop: theme.space[3],
              }}>
              {CURRENCY_OPTIONS.map(code => (
                <Button
                  key={code}
                  label={code}
                  variant={currency === code ? 'primary' : 'secondary'}
                  onPress={() => selectCurrency(code)}
                />
              ))}
            </View>
            <View style={{height: theme.space[3]}} />
            <Button
              label={t('common.continue')}
              onPress={() => {
                onCurrencyNext().catch(() => undefined);
              }}
              fullWidth
              size="lg"
            />
            <Button
              label={t('common.skip')}
              variant="ghost"
              onPress={skipToAccount}
              fullWidth
            />
          </Card>
        ) : null}

        {step === 2 ? (
          <Card>
            <Text variant="headline">{t('onboarding.accountTitle')}</Text>
            <Input
              label={t('onboarding.accountName')}
              value={accountName}
              onChangeText={setAccountName}
            />
            <View style={{height: theme.space[3]}} />
            <Button
              label={t('common.continue')}
              onPress={() => {
                onAccountNext().catch(() => undefined);
              }}
              fullWidth
              size="lg"
            />
            <Button
              label={t('common.skip')}
              variant="ghost"
              onPress={skipToLock}
              fullWidth
            />
          </Card>
        ) : null}

        {step === 3 && Platform.OS === 'android' ? (
          <Card>
            <Text variant="headline">{t('onboarding.smsTitle')}</Text>
            <Text variant="body" color="secondary">
              {t('onboarding.smsBody')}
            </Text>
            <View style={{height: theme.space[3]}} />
            <Button
              label={t('common.continue')}
              onPress={() => {
                onSmsNext().catch(() => undefined);
              }}
              fullWidth
              size="lg"
            />
            <Button
              label={t('common.skip')}
              variant="ghost"
              onPress={skipSms}
              fullWidth
            />
          </Card>
        ) : null}

        {step === 4 ? (
          <Card>
            <Text variant="headline">{t('onboarding.lockTitle')}</Text>
            <Text variant="body" color="secondary" style={{marginTop: theme.space[2]}}>
              {t('onboarding.lockBody')}
            </Text>
            <Input
              label={t('onboarding.pinPlaceholder')}
              value={pin}
              onChangeText={setPinValue}
              keyboardType="number-pad"
              secureTextEntry
              editable={!savingLock}
              error={lockError}
            />
            <View style={{height: theme.space[3]}} />
            <Button
              label={t('onboarding.finish')}
              onPress={() => {
                onLockFinish().catch(() => undefined);
              }}
              loading={savingLock}
              fullWidth
              size="lg"
            />
            <Button
              label={t('common.skip')}
              variant="ghost"
              disabled={savingLock}
              onPress={() => {
                finish().catch(() => undefined);
              }}
              fullWidth
            />
          </Card>
        ) : null}
      </ScrollView>
    </ScreenBackdrop>
  );
}
