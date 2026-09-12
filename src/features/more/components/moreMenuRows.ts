import {Platform} from 'react-native';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {IconName} from '../../../design/icons/Icon';

/** Menu destinations — screens that need no required params. */
export type MoreMenuRoute = {
  [K in keyof MoreStackParamList]: undefined extends MoreStackParamList[K]
    ? K
    : never;
}[keyof MoreStackParamList];

export type MoreMenuRow = {
  titleKey: string;
  subtitleKey: string;
  icon: IconName;
  route: MoreMenuRoute;
};

export type MoreMenuGroup = {
  labelKey: string;
  rows: MoreMenuRow[];
};

export const MORE_MENU_GROUPS: MoreMenuGroup[] = [
  {
    labelKey: 'more.groups.money',
    rows: [
      {
        titleKey: 'more.accounts.title',
        subtitleKey: 'more.accounts.subtitle',
        icon: 'Wallet',
        route: 'Accounts',
      },
      {
        titleKey: 'more.categories.title',
        subtitleKey: 'more.categories.subtitle',
        icon: 'Receipt',
        route: 'Categories',
      },
      {
        titleKey: 'more.tags.title',
        subtitleKey: 'more.tags.subtitle',
        icon: 'Tag',
        route: 'Tags',
      },
      {
        titleKey: 'more.merchants.title',
        subtitleKey: 'more.merchants.subtitle',
        icon: 'ShoppingBag',
        route: 'MerchantAliases',
      },
    ],
  },
  {
    labelKey: 'more.groups.planning',
    rows: [
      {
        titleKey: 'more.budgets.title',
        subtitleKey: 'more.budgets.subtitle',
        icon: 'Target',
        route: 'Budgets',
      },
      {
        titleKey: 'more.subscriptions.title',
        subtitleKey: 'more.subscriptions.subtitle',
        icon: 'Calendar',
        route: 'Subscriptions',
      },
      {
        titleKey: 'more.recurring.title',
        subtitleKey: 'more.recurring.subtitle',
        icon: 'RotateCcw',
        route: 'RecurringRules',
      },
    ],
  },
  {
    labelKey: 'more.groups.import',
    rows: [
      {
        titleKey: Platform.OS === 'ios' ? 'more.pasteImport.title' : 'more.smsImport.title',
        subtitleKey:
          Platform.OS === 'ios' ? 'more.pasteImport.subtitle' : 'more.smsImport.subtitle',
        icon: 'MessageSquare',
        route: Platform.OS === 'ios' ? 'PasteImport' : 'SmsInbox',
      },
    ],
  },
  {
    labelKey: 'more.groups.data',
    rows: [
      {
        titleKey: 'more.trash.title',
        subtitleKey: 'more.trash.subtitle',
        icon: 'Trash2',
        route: 'Trash',
      },
      {
        titleKey: 'more.backup.title',
        subtitleKey: 'more.backup.subtitle',
        icon: 'Download',
        route: 'BackupExport',
      },
    ],
  },
  {
    labelKey: 'more.groups.settings',
    rows: [
      {
        titleKey: 'more.fx.title',
        subtitleKey: 'more.fx.subtitle',
        icon: 'ArrowLeftRight',
        route: 'FxRates',
      },
      {
        titleKey: 'more.baseCurrency.title',
        subtitleKey: 'more.baseCurrency.subtitle',
        icon: 'Banknote',
        route: 'BaseCurrency',
      },
      {
        titleKey: 'more.notifications.title',
        subtitleKey: 'more.notifications.subtitle',
        icon: 'Bell',
        route: 'NotificationsSettings',
      },
      {
        titleKey: 'more.security.title',
        subtitleKey: 'more.security.subtitle',
        icon: 'Lock',
        route: 'SecuritySettings',
      },
      {
        titleKey: 'more.appearance.title',
        subtitleKey: 'more.appearance.subtitle',
        icon: 'Settings',
        route: 'Appearance',
      },
      {
        titleKey: 'more.language.title',
        subtitleKey: 'more.language.subtitle',
        icon: 'Languages',
        route: 'Language',
      },
      {
        titleKey: 'more.onboarding.title',
        subtitleKey: 'more.onboarding.subtitle',
        icon: 'Sparkles',
        route: 'Onboarding',
      },
    ],
  },
];
