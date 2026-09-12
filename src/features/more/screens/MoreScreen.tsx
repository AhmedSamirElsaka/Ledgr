import {useMemo, useState} from 'react';

import {View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import {ScreenEnter} from '../../../design/motion/ScreenEnter';
import {Input} from '../../../design/primitives/Input';
import {ScreenScaffold} from '../../../design/primitives/ScreenScaffold';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {MoreMenuGroupCard, MoreMenuRow} from '../components/MoreMenuRow';
import {
  MORE_MENU_GROUPS,
  type MoreMenuGroup,
  type MoreMenuRoute,
  type MoreMenuRow as MoreMenuRowData,
} from '../components/moreMenuRows';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

type MoreNav = NativeStackNavigationProp<MoreStackParamList>;

/** React Navigation cannot narrow a union of screen names; menu routes are param-less. */
function openMoreRoute(navigation: MoreNav, route: MoreMenuRoute) {
  navigation.navigate(route as 'Accounts');
}

function rowMatchesQuery(
  row: MoreMenuRowData,
  query: string,
  t: (key: string) => string,
): boolean {
  const haystack = `${t(row.titleKey)} ${t(row.subtitleKey)}`.toLowerCase();
  return haystack.includes(query);
}

export function MoreScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const navigation = useNavigation<MoreNav>();
  const [query, setQuery] = useState('');

  const groups = useMemo((): MoreMenuGroup[] => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return MORE_MENU_GROUPS;
    }
    return MORE_MENU_GROUPS.map(group => ({
      ...group,
      rows: group.rows.filter(row => rowMatchesQuery(row, normalized, t)),
    })).filter(group => group.rows.length > 0);
  }, [query, t]);

  return (
    <ScreenEnter>
      <ScreenScaffold
        eyebrow={t('more.eyebrow')}
        title={t('more.title')}
        description={t('more.subtitle')}
        washHeight={280}>
        <Input
          label={t('more.searchLabel')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('more.searchPlaceholder')}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          accessibilityLabel={t('more.searchLabel')}
        />

        {groups.length === 0 ? (
          <View style={{gap: theme.space[2], paddingVertical: theme.space[6]}}>
            <Text variant="headline">{t('more.searchEmptyTitle')}</Text>
            <Text variant="body" color="secondary">
              {t('more.searchEmptyBody')}
            </Text>
          </View>
        ) : (
          groups.map(group => (
            <View key={group.labelKey} style={{gap: theme.space[2]}}>
              <Text variant="label" color="tertiary">
                {t(group.labelKey)}
              </Text>
              <MoreMenuGroupCard>
                {group.rows.map((row, index) => (
                  <MoreMenuRow
                    key={`${row.route}-${row.titleKey}`}
                    row={row}
                    showSeparator={index > 0}
                    onPress={() => openMoreRoute(navigation, row.route)}
                  />
                ))}
              </MoreMenuGroupCard>
            </View>
          ))
        )}
      </ScreenScaffold>
    </ScreenEnter>
  );
}
