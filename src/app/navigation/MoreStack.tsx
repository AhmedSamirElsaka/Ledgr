import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import {useTheme} from '../../design/theme/ThemeProvider';
import {BudgetFormScreen, BudgetsScreen} from '../../features/budgets';
import {
  AccountFormScreen,
  AccountsScreen,
  AppearanceScreen,
  BackupExportScreen,
  BaseCurrencyScreen,
  CategoriesScreen,
  CategoryFormScreen,
  FxRatesScreen,
  LanguageScreen,
  MerchantAliasFormScreen,
  MerchantAliasesScreen,
  MoreScreen,
  NotificationsSettingsScreen,
  SecuritySettingsScreen,
  TagFormScreen,
  TagsScreen,
  TrashScreen,
} from '../../features/more';
import {OnboardingScreen} from '../../features/onboarding';
import {RecurringRuleFormScreen, RecurringRulesScreen} from '../../features/recurring';
import {
  PasteImportScreen,
  SmsGenerateRuleScreen,
  SmsInboxScreen,
  SmsRuleFormScreen,
  SmsRulesScreen,
  SmsRuleTesterScreen,
} from '../../features/sms';
import {SubscriptionFormScreen, SubscriptionsScreen} from '../../features/subscriptions';

import {createThemedStackOptions} from './stackHeaderOptions';

import type {MoreStackParamList} from './types';

const MoreStack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStackNavigator() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const themed = createThemedStackOptions({theme});

  return (
    <MoreStack.Navigator screenOptions={themed}>
      <MoreStack.Screen
        name="MoreMain"
        component={MoreScreen}
        options={{headerShown: false}}
      />
      <MoreStack.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{title: t('nav.accounts')}}
      />
      <MoreStack.Screen
        name="AccountForm"
        component={AccountFormScreen}
        options={{title: t('nav.account')}}
      />
      <MoreStack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{title: t('nav.categories')}}
      />
      <MoreStack.Screen
        name="CategoryForm"
        component={CategoryFormScreen}
        options={{title: t('nav.category')}}
      />
      <MoreStack.Screen
        name="Tags"
        component={TagsScreen}
        options={{title: t('nav.tags')}}
      />
      <MoreStack.Screen
        name="TagForm"
        component={TagFormScreen}
        options={{title: t('nav.tag')}}
      />
      <MoreStack.Screen
        name="MerchantAliases"
        component={MerchantAliasesScreen}
        options={{title: t('nav.merchantAliases')}}
      />
      <MoreStack.Screen
        name="MerchantAliasForm"
        component={MerchantAliasFormScreen}
        options={{title: t('nav.merchantAlias')}}
      />
      <MoreStack.Screen
        name="Trash"
        component={TrashScreen}
        options={{title: t('nav.trash')}}
      />
      <MoreStack.Screen
        name="FxRates"
        component={FxRatesScreen}
        options={{title: t('nav.fxRates')}}
      />
      <MoreStack.Screen
        name="BaseCurrency"
        component={BaseCurrencyScreen}
        options={{title: t('nav.baseCurrency')}}
      />
      <MoreStack.Screen
        name="Budgets"
        component={BudgetsScreen}
        options={{title: t('nav.budgets')}}
      />
      <MoreStack.Screen
        name="BudgetForm"
        component={BudgetFormScreen}
        options={{title: t('nav.budget')}}
      />
      <MoreStack.Screen
        name="Appearance"
        component={AppearanceScreen}
        options={{title: t('nav.appearance')}}
      />
      <MoreStack.Screen
        name="Language"
        component={LanguageScreen}
        options={{title: t('nav.language')}}
      />
      <MoreStack.Screen
        name="SmsInbox"
        component={SmsInboxScreen}
        options={{title: t('nav.smsInbox')}}
      />
      <MoreStack.Screen
        name="SmsRules"
        component={SmsRulesScreen}
        options={{title: t('nav.smsRules')}}
      />
      <MoreStack.Screen
        name="SmsRuleForm"
        component={SmsRuleFormScreen}
        options={{title: t('nav.smsRule')}}
      />
      <MoreStack.Screen
        name="SmsRuleTester"
        component={SmsRuleTesterScreen}
        options={{title: t('nav.ruleTester')}}
      />
      <MoreStack.Screen
        name="SmsGenerateRule"
        component={SmsGenerateRuleScreen}
        options={{title: t('nav.generateRule')}}
      />
      <MoreStack.Screen
        name="PasteImport"
        component={PasteImportScreen}
        options={{title: t('nav.pasteImport')}}
      />
      <MoreStack.Screen
        name="Subscriptions"
        component={SubscriptionsScreen}
        options={{title: t('nav.subscriptions')}}
      />
      <MoreStack.Screen
        name="SubscriptionForm"
        component={SubscriptionFormScreen}
        options={{title: t('nav.subscription')}}
      />
      <MoreStack.Screen
        name="RecurringRules"
        component={RecurringRulesScreen}
        options={{title: t('nav.recurringRules')}}
      />
      <MoreStack.Screen
        name="RecurringRuleForm"
        component={RecurringRuleFormScreen}
        options={{title: t('nav.recurringRule')}}
      />
      <MoreStack.Screen
        name="BackupExport"
        component={BackupExportScreen}
        options={{title: t('nav.backupExport')}}
      />
      <MoreStack.Screen
        name="SecuritySettings"
        component={SecuritySettingsScreen}
        options={{title: t('nav.securitySettings')}}
      />
      <MoreStack.Screen
        name="NotificationsSettings"
        component={NotificationsSettingsScreen}
        options={{title: t('nav.notificationsSettings')}}
      />
      <MoreStack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{headerShown: false, title: t('nav.onboarding')}}
      />
    </MoreStack.Navigator>
  );
}
