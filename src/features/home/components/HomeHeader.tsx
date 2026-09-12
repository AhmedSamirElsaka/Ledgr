import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Card} from '../../../design/primitives/Card';
import {ListRow} from '../../../design/primitives/ListRow';
import {SegmentedControl} from '../../../design/primitives/SegmentedControl';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';
import {periodLabelKey} from '../../../domain/period/periodRange';
import {type PeriodFilter} from '../../../store/uiStore';

import {HomeAccountsCard} from './HomeAccountsCard';
import {HomeMonthReviewTeaser} from './HomeMonthReviewTeaser';
import {HomePeriodSpendCard} from './HomePeriodSpendCard';

import type {AccountWithBalance} from '../../../db/repositories/accountsRepository';

const HOME_PERIODS: PeriodFilter[] = ['7d', '30d', 'month', 'year'];

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

type HomeHeaderProps = {
  period: PeriodFilter;
  setPeriod: (p: PeriodFilter) => void;
  showCashPrompt: boolean;
  baseCurrency: CurrencyCode;
  spendMinor: number;
  streak: number;
  accounts: AccountWithBalance[];
  onCreateCash: () => void;
  onDismissCash: () => void;
  onOpenBudgets: () => void;
  onImportSms?: () => void;
  onOpenAccounts: () => void;
  onOpenAccount: (id: string) => void;
  onOpenInsights: () => void;
};

export function HomeHeader({
  period,
  setPeriod,
  showCashPrompt,
  baseCurrency,
  spendMinor,
  streak,
  accounts,
  onCreateCash,
  onDismissCash,
  onOpenBudgets,
  onImportSms,
  onOpenAccounts,
  onOpenAccount,
  onOpenInsights,
}: HomeHeaderProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const periodValue = HOME_PERIODS.includes(period) ? period : '30d';

  return (
    <View style={{gap: theme.space[5]}}>
      <View style={{gap: theme.space[1]}}>
        <Text variant="label" color="tertiary">
          {t('home.brandLabel')}
        </Text>
        <Text variant="display">{t('home.title')}</Text>
        <Text variant="body" color="secondary">
          {t('home.subtitle')}
        </Text>
      </View>

      {showCashPrompt ? (
        <Card elevated>
          <Text variant="headline">{t('home.createAccountTitle')}</Text>
          <Text variant="body" color="secondary" style={{marginTop: theme.space[2]}}>
            {t('home.createAccountBody', {currency: baseCurrency})}
          </Text>
          <View style={{height: theme.space[4]}} />
          <Button
            label={t('home.createCash')}
            onPress={onCreateCash}
            fullWidth
            size="lg"
          />
          <View style={{height: theme.space[2]}} />
          <Button
            label={t('common.notNow')}
            variant="ghost"
            onPress={onDismissCash}
            fullWidth
          />
        </Card>
      ) : null}

      <View style={{gap: theme.space[3]}}>
        <HomePeriodSpendCard
          baseCurrency={asCurrency(baseCurrency)}
          spendMinor={spendMinor}
          streak={streak}
          onOpenBudgets={onOpenBudgets}
        />
        <SegmentedControl
          options={HOME_PERIODS.map(p => ({id: p, label: t(periodLabelKey(p))}))}
          value={periodValue}
          onChange={setPeriod}
          accessibilityLabel={t('home.periodA11y')}
        />
      </View>

      <HomeMonthReviewTeaser onOpenInsights={onOpenInsights} />

      {onImportSms ? (
        <Card padded={false}>
          <ListRow
            variant="inset"
            icon="MessageSquare"
            title={t('home.importSmsTitle')}
            subtitle={t('home.importSmsSubtitle')}
            onPress={onImportSms}
            accessibilityLabel={t('home.importSmsTitle')}
          />
        </Card>
      ) : null}

      <HomeAccountsCard
        accounts={accounts}
        onOpenAccounts={onOpenAccounts}
        onOpenAccount={onOpenAccount}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}>
        <Text variant="headline">{t('home.recent')}</Text>
        <Text variant="caption" color="tertiary">
          {t('home.recentMeta')}
        </Text>
      </View>
    </View>
  );
}
