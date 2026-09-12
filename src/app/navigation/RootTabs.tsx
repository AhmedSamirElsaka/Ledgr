import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTranslation} from 'react-i18next';

import {AnimatedTabIcon} from '../../design/motion/AnimatedTabIcon';
import {useTheme} from '../../design/theme/ThemeProvider';
import {useUiStore} from '../../store/uiStore';

import {AnalyticsStackNavigator} from './AnalyticsStack';
import {HomeStackNavigator} from './HomeStack';
import {MoreStackNavigator} from './MoreStack';
import {TransactionsStackNavigator} from './TransactionsStack';

import type {RootTabParamList} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabIconHome({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) {
  return <AnimatedTabIcon name="Home" color={color} size={size} focused={focused} />;
}

function TabIconTransactions({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) {
  return (
    <AnimatedTabIcon name="Receipt" color={color} size={size} focused={focused} />
  );
}

function TabIconAnalytics({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) {
  return (
    <AnimatedTabIcon name="ChartPie" color={color} size={size} focused={focused} />
  );
}

function TabIconMore({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) {
  return (
    <AnimatedTabIcon
      name="MoreHorizontal"
      color={color}
      size={size}
      focused={focused}
    />
  );
}

export function RootTabs() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const setSelectedTab = useUiStore(s => s.setSelectedTab);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        lazy: true,
        tabBarActiveTintColor: theme.colors.accent.primary,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface.raised,
          borderTopColor: theme.colors.border.subtle,
          borderTopWidth: 1,
          height: 64,
          paddingTop: theme.space[1],
          paddingBottom: theme.space[2],
          ...theme.elevation[1],
        },
      }}
      screenListeners={{
        state: e => {
          const route = e.data.state?.routes[e.data.state.index ?? 0];
          if (
            route?.name === 'Home' ||
            route?.name === 'Transactions' ||
            route?.name === 'Analytics' ||
            route?.name === 'More'
          ) {
            setSelectedTab(route.name);
          }
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{tabBarIcon: TabIconHome, tabBarLabel: t('tabs.home')}}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsStackNavigator}
        options={{tabBarIcon: TabIconTransactions, tabBarLabel: t('tabs.activity')}}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsStackNavigator}
        options={{tabBarIcon: TabIconAnalytics, tabBarLabel: t('tabs.insights')}}
      />
      <Tab.Screen
        name="More"
        component={MoreStackNavigator}
        options={{tabBarIcon: TabIconMore, tabBarLabel: t('tabs.more')}}
      />
    </Tab.Navigator>
  );
}
