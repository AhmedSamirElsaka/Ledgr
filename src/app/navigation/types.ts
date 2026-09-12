import type {NavigatorScreenParams} from '@react-navigation/native';

export type HomeStackParamList = {
  HomeMain: undefined;
  AddTransaction: {id?: string} | undefined;
  Budgets: undefined;
  BudgetForm: {id?: string} | undefined;
};

export type TransactionsStackParamList = {
  TransactionsList: undefined;
  AddTransaction: {id?: string} | undefined;
};

export type AnalyticsStackParamList = {
  AnalyticsMain: undefined;
  AnalyticsTransactions: {
    categoryId?: string;
    merchant?: string;
    accountId?: string;
    source?: 'manual' | 'sms' | 'recurring' | 'import';
    excludeSource?: 'manual' | 'sms' | 'recurring' | 'import';
    title?: string;
  };
};

export type MoreStackParamList = {
  MoreMain: undefined;
  Accounts: undefined;
  AccountForm: {id?: string} | undefined;
  Categories: undefined;
  CategoryForm: {id?: string} | undefined;
  Tags: undefined;
  TagForm: {id?: string} | undefined;
  MerchantAliases: undefined;
  MerchantAliasForm: {id?: string} | undefined;
  Trash: undefined;
  FxRates: undefined;
  BaseCurrency: undefined;
  Budgets: undefined;
  BudgetForm: {id?: string} | undefined;
  Appearance: undefined;
  Language: undefined;
  SmsInbox: undefined;
  SmsRules: undefined;
  SmsRuleForm: {id?: string} | undefined;
  SmsRuleTester: undefined;
  SmsGenerateRule: {messageId?: string; body?: string; sender?: string} | undefined;
  PasteImport: undefined;
  Subscriptions: undefined;
  SubscriptionForm: {id?: string} | undefined;
  RecurringRules: undefined;
  RecurringRuleForm: {id?: string} | undefined;
  BackupExport: undefined;
  SecuritySettings: undefined;
  NotificationsSettings: undefined;
  Onboarding: undefined;
};

export type RootTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Transactions: NavigatorScreenParams<TransactionsStackParamList> | undefined;
  Analytics: NavigatorScreenParams<AnalyticsStackParamList> | undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
};
