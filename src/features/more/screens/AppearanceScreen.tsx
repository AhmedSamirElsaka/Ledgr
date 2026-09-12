import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Icon} from '../../../design/icons/Icon';
import {FormSection} from '../../../design/primitives/FormSection';
import {ListRow} from '../../../design/primitives/ListRow';
import {useTheme, type AppearancePreference} from '../../../design/theme/ThemeProvider';
import {MoreStackChrome} from '../components/MoreStackChrome';

import type {IconName} from '../../../design/icons/Icon';

const OPTIONS: AppearancePreference[] = ['system', 'light', 'dark'];

function appearanceIcon(option: AppearancePreference): IconName {
  switch (option) {
    case 'system':
      return 'Settings';
    case 'light':
      return 'Sparkles';
    case 'dark':
      return 'Flame';
  }
}

export function AppearanceScreen() {
  const {t} = useTranslation();
  const {theme, appearance, setAppearance} = useTheme();

  const labelFor = (option: AppearancePreference): string => {
    switch (option) {
      case 'system':
        return t('appearance.system');
      case 'light':
        return t('appearance.light');
      case 'dark':
        return t('appearance.dark');
    }
  };

  return (
    <MoreStackChrome>
      <FormSection title={t('nav.appearance')} description={t('appearance.body')}>
        <View style={{gap: theme.space[2]}}>
          {OPTIONS.map(option => (
            <ListRow
              key={option}
              title={labelFor(option)}
              icon={appearanceIcon(option)}
              showDisclosure={false}
              trailing={
                appearance === option ? (
                  <Icon name="Check" size={20} color={theme.colors.accent.primary} />
                ) : null
              }
              onPress={() => setAppearance(option)}
            />
          ))}
        </View>
      </FormSection>
    </MoreStackChrome>
  );
}
