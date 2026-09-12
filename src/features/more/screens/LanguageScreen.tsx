import {Alert, View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Icon} from '../../../design/icons/Icon';
import {FormSection} from '../../../design/primitives/FormSection';
import {ListRow} from '../../../design/primitives/ListRow';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  getAppLanguage,
  setAppLanguage,
  type AppLanguage,
} from '../../../i18n';
import {MoreStackChrome} from '../components/MoreStackChrome';

const OPTIONS: AppLanguage[] = ['en', 'ar'];

export function LanguageScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const current = getAppLanguage();

  const onSelect = (language: AppLanguage) => {
    if (language === current) {
      return;
    }
    Alert.alert(t('language.title'), t('language.restartHint'), [
      {text: t('common.cancel'), style: 'cancel'},
      {
        text: t('common.continue'),
        onPress: () => {
          setAppLanguage(language).catch(() => undefined);
        },
      },
    ]);
  };

  return (
    <MoreStackChrome>
      <FormSection title={t('language.title')} description={t('language.body')}>
        <View style={{gap: theme.space[2]}}>
          {OPTIONS.map(option => (
            <ListRow
              key={option}
              title={option === 'en' ? t('language.en') : t('language.ar')}
              icon="Languages"
              showDisclosure={false}
              trailing={
                current === option ? (
                  <Icon name="Check" size={20} color={theme.colors.accent.primary} />
                ) : null
              }
              onPress={() => onSelect(option)}
            />
          ))}
        </View>
      </FormSection>
    </MoreStackChrome>
  );
}
