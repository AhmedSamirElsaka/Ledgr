import {AccountsRepository} from './repositories/accountsRepository';
import {AnalyticsRepository} from './repositories/analyticsRepository';
import {BudgetsRepository} from './repositories/budgetsRepository';
import {CategoriesRepository} from './repositories/categoriesRepository';
import {FxRatesRepository} from './repositories/fxRatesRepository';
import {MerchantAliasesRepository} from './repositories/merchantAliasesRepository';
import {RecurringRulesRepository} from './repositories/recurringRulesRepository';
import {SettingsRepository} from './repositories/settingsRepository';
import {SmsMessagesRepository} from './repositories/smsMessagesRepository';
import {SmsRulesRepository} from './repositories/smsRulesRepository';
import {SubscriptionsRepository} from './repositories/subscriptionsRepository';
import {TagsRepository} from './repositories/tagsRepository';
import {TransactionsRepository} from './repositories/transactionsRepository';

import type {SqlDatabase} from './types';

export type DatabaseRepos = {
  db: SqlDatabase;
  accounts: AccountsRepository;
  categories: CategoriesRepository;
  settings: SettingsRepository;
  transactions: TransactionsRepository;
  tags: TagsRepository;
  budgets: BudgetsRepository;
  fxRates: FxRatesRepository;
  smsRules: SmsRulesRepository;
  smsMessages: SmsMessagesRepository;
  merchantAliases: MerchantAliasesRepository;
  subscriptions: SubscriptionsRepository;
  recurringRules: RecurringRulesRepository;
  analytics: AnalyticsRepository;
};

export function createRepos(db: SqlDatabase): DatabaseRepos {
  return {
    db,
    accounts: new AccountsRepository(db),
    categories: new CategoriesRepository(db),
    settings: new SettingsRepository(db),
    transactions: new TransactionsRepository(db),
    tags: new TagsRepository(db),
    budgets: new BudgetsRepository(db),
    fxRates: new FxRatesRepository(db),
    smsRules: new SmsRulesRepository(db),
    smsMessages: new SmsMessagesRepository(db),
    merchantAliases: new MerchantAliasesRepository(db),
    subscriptions: new SubscriptionsRepository(db),
    recurringRules: new RecurringRulesRepository(db),
    analytics: new AnalyticsRepository(db),
  };
}
