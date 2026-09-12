import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import {useTheme} from '../../design/theme/ThemeProvider';
import {BudgetFormScreen, BudgetsScreen} from '../../features/budgets';
import {HomeScreen} from '../../features/home';
import {AddTransactionScreen} from '../../features/transactions';

import {createThemedStackOptions} from './stackHeaderOptions';

import type {HomeStackParamList} from './types';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const themed = createThemedStackOptions({theme, headerShown: false});

  return (
    <HomeStack.Navigator screenOptions={themed}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <HomeStack.Screen
        name="Budgets"
        component={BudgetsScreen}
        options={{headerShown: true, title: t('nav.budgets')}}
      />
      <HomeStack.Screen
        name="BudgetForm"
        component={BudgetFormScreen}
        options={{headerShown: true, title: t('nav.budget')}}
      />
    </HomeStack.Navigator>
  );
}
