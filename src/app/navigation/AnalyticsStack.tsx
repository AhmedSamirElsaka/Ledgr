import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import {useTheme} from '../../design/theme/ThemeProvider';
import {AnalyticsScreen, AnalyticsTransactionsScreen} from '../../features/analytics';

import {createThemedStackOptions} from './stackHeaderOptions';

import type {AnalyticsStackParamList} from './types';

const AnalyticsStack = createNativeStackNavigator<AnalyticsStackParamList>();

export function AnalyticsStackNavigator() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const themed = createThemedStackOptions({theme, headerShown: false});

  return (
    <AnalyticsStack.Navigator screenOptions={themed}>
      <AnalyticsStack.Screen
        name="AnalyticsMain"
        component={AnalyticsScreen}
        options={{headerShown: false}}
      />
      <AnalyticsStack.Screen
        name="AnalyticsTransactions"
        component={AnalyticsTransactionsScreen}
        options={({route}) => ({
          headerShown: true,
          title: route.params?.title ?? t('nav.transactions'),
        })}
      />
    </AnalyticsStack.Navigator>
  );
}
