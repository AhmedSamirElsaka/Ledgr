import {View} from 'react-native';

import {useTranslation} from 'react-i18next';
import {LineChart} from 'react-native-gifted-charts';

import {Amount} from '../../../design/primitives/Amount';
import {Card, HeroCard} from '../../../design/primitives/Card';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  formatMoney,
  money,
  type CurrencyCode,
} from '../../../domain/money/Money';
import {getNumberLocale} from '../../../i18n/formatLocale';
import {formatAnalyticsAxisLabel} from '../formatAnalyticsPeriod';
import {useAnalyticsCopy} from '../hooks/useAnalyticsCopy';

import {ChartProseSummary} from './ChartProseSummary';

import type {
  IncomeExpense,
  SpendPoint,
  AmountStats,
} from '../../../db/repositories/analyticsRepository';

type AnalyticsOverviewSectionProps = {
  base: CurrencyCode;
  ie: IncomeExpense;
  stats: AmountStats;
  spend: SpendPoint[];
};

export function AnalyticsOverviewSection({
  base,
  ie,
  stats,
  spend,
}: AnalyticsOverviewSectionProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const locale = getNumberLocale();
  const {spendSummary} = useAnalyticsCopy();
  const netMinor = ie.incomeMinor - ie.expenseMinor;
  const trend = spendSummary(spend, base);
  const showChart = spend.length > 1;

  return (
    <View style={{gap: theme.space[4]}}>
      <HeroCard>
        <Text
          variant="label"
          style={{
            color: theme.colors.hero.muted,
            letterSpacing: theme.typography.label.letterSpacing,
          }}>
          {t('insights.netSummary')}
        </Text>
        <View style={{marginTop: theme.space[3]}}>
          <Amount
            value={money(netMinor, base)}
            size="lg"
            tone="onHero"
            signed
            formatOptions={{locale}}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            gap: theme.space[3],
            marginTop: theme.space[5],
          }}>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.hero.chip,
              borderRadius: theme.radius.lg,
              padding: theme.space[3],
              gap: theme.space[1],
            }}>
            <Text variant="caption" style={{color: theme.colors.hero.muted}}>
              {t('insights.income')}
            </Text>
            <Amount
              value={money(ie.incomeMinor, base)}
              size="sm"
              tone="onHero"
              signed
              formatOptions={{locale}}
            />
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.hero.chip,
              borderRadius: theme.radius.lg,
              padding: theme.space[3],
              gap: theme.space[1],
            }}>
            <Text variant="caption" style={{color: theme.colors.hero.muted}}>
              {t('insights.expense')}
            </Text>
            <Amount
              value={money(-Math.abs(ie.expenseMinor), base)}
              size="sm"
              tone="onHero"
              signed
              formatOptions={{locale}}
            />
          </View>
        </View>
        <Text
          variant="caption"
          style={{
            color: theme.colors.hero.muted,
            marginTop: theme.space[4],
          }}
          accessibilityLabel={t('insights.avg', {
            avg: formatMoney(money(stats.avgMinor, base), {locale}),
            median: formatMoney(money(stats.medianMinor, base), {locale}),
            count: stats.count,
          })}>
          {t('insights.avg', {
            avg: formatMoney(money(stats.avgMinor, base), {locale}),
            median: formatMoney(money(stats.medianMinor, base), {locale}),
            count: stats.count,
          })}
        </Text>
      </HeroCard>

      <Card elevated>
        <Text variant="label" color="tertiary">
          {t('insights.trendEyebrow')}
        </Text>
        <Text variant="headline" style={{marginTop: theme.space[2]}}>
          {t('insights.spendOverTime')}
        </Text>
        <ChartProseSummary
          summary={trend.text}
          accessibilityHint={trend.hint}
          muted={trend.muted}
        />
        {showChart ? (
          <View
            accessible
            accessibilityLabel={trend.text}
            accessibilityHint={trend.hint}
            style={{marginTop: theme.space[4]}}>
            <LineChart
              data={spend.map(p => ({
                value: p.totalMinor / 100,
                label: formatAnalyticsAxisLabel(p.period),
              }))}
              color={theme.colors.chart.series1}
              thickness={2}
              hideDataPoints={spend.length > 14}
              yAxisColor={theme.colors.chart.grid}
              xAxisColor={theme.colors.chart.grid}
              yAxisTextStyle={{color: theme.colors.text.tertiary}}
              xAxisLabelTextStyle={{
                color: theme.colors.text.tertiary,
                fontSize: theme.typography.caption.fontSize,
              }}
              backgroundColor={theme.colors.surface.raised}
              rulesColor={theme.colors.border.subtle}
            />
          </View>
        ) : null}
      </Card>
    </View>
  );
}
