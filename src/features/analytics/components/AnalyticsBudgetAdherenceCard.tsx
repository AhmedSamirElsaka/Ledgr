import {useMemo} from 'react';

import {View} from 'react-native';

import {useTranslation} from 'react-i18next';
import {BarChart} from 'react-native-gifted-charts';

import {Amount} from '../../../design/primitives/Amount';
import {Card} from '../../../design/primitives/Card';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  formatMoney,
  money,
  type CurrencyCode,
} from '../../../domain/money/Money';
import {getNumberLocale} from '../../../i18n/formatLocale';
import {formatAnalyticsAxisLabel} from '../formatAnalyticsPeriod';

import {ChartProseSummary} from './ChartProseSummary';

import type {BudgetAdherenceSeries} from '../../../db/repositories/analyticsRepository';

type Props = {
  base: CurrencyCode;
  series: BudgetAdherenceSeries[];
  onBudgetPress: (categoryId: string | null, title: string) => void;
};

export function AnalyticsBudgetAdherenceCard({
  base,
  series,
  onBudgetPress,
}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const locale = getNumberLocale();

  const primary = series[0] ?? null;
  const points = useMemo(
    () => primary?.points ?? [],
    [primary?.points],
  );
  const labelFor = (item: BudgetAdherenceSeries) =>
    item.categoryId == null || item.categoryName.length === 0
      ? t('insights.budgetAllExpenses')
      : item.categoryName;

  const prose = useMemo(() => {
    if (series.length === 0) {
      return {text: t('insights.budgetEmpty'), muted: true};
    }
    if (!primary || points.length === 0) {
      return {text: t('insights.budgetNoPeriods'), muted: true};
    }
    const primaryName =
      primary.categoryId == null || primary.categoryName.length === 0
        ? t('insights.budgetAllExpenses')
        : primary.categoryName;
    if (points.length === 1) {
      const only = points[0];
      if (!only) {
        return {text: t('insights.budgetNoPeriods'), muted: true};
      }
      return {
        text: t('insights.budgetSinglePoint', {
          spent: formatMoney(money(only.spentMinor, base), {locale}),
          budget: formatMoney(money(only.budgetMinor, base), {locale}),
        }),
        muted: true,
      };
    }
    const overCount = points.filter(p => p.overBudget).length;
    return {
      text: t('insights.budgetSeriesSummary', {
        name: primaryName,
        count: points.length,
        overCount,
      }),
      muted: false,
    };
  }, [base, locale, points, primary, series.length, t]);

  return (
    <Card>
      <Text variant="label" color="tertiary">
        {t('insights.budgetEyebrow')}
      </Text>
      <Text variant="headline" style={{marginTop: theme.space[2]}}>
        {t('insights.budgetTitle')}
      </Text>
      <Text
        variant="caption"
        color="secondary"
        style={{marginTop: theme.space[1]}}>
        {t('insights.budgetSubtitle')}
      </Text>
      <ChartProseSummary
        summary={prose.text}
        accessibilityHint={t('insights.summaries.drillHint')}
        muted={prose.muted}
      />

      {series.length === 0 ? null : (
        <View style={{marginTop: theme.space[3], gap: theme.space[3]}}>
          {series.slice(0, 4).map(item => {
            const latest = item.points[item.points.length - 1];
            const title = labelFor(item);
            return (
              <Pressable
                key={item.budgetId}
                onPress={() => onBudgetPress(item.categoryId, title)}
                accessibilityLabel={t('insights.budgetRowA11y', {name: title})}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: theme.space[3],
                  paddingVertical: theme.space[2],
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border.subtle,
                }}>
                <View style={{flex: 1, gap: theme.space[1]}}>
                  <Text variant="bodyStrong">{title}</Text>
                  <Text variant="caption" color="tertiary">
                    {item.periodKind}
                    {latest
                      ? latest.overBudget
                        ? ` · ${t('insights.budgetOver')}`
                        : ` · ${t('insights.budgetOnTrack')}`
                      : ''}
                  </Text>
                </View>
                {latest ? (
                  <View style={{alignItems: 'flex-end', gap: theme.space[1]}}>
                    <Amount
                      value={money(latest.spentMinor, base)}
                      size="sm"
                      formatOptions={{locale}}
                    />
                    <Text variant="caption" color="tertiary">
                      /{' '}
                      {formatMoney(money(latest.budgetMinor, base), {locale})}
                    </Text>
                  </View>
                ) : (
                  <Text variant="caption" color="tertiary">
                    {t('insights.budgetNoPeriods')}
                  </Text>
                )}
              </Pressable>
            );
          })}

          {points.length > 1 ? (
            <View
              accessible
              accessibilityLabel={prose.text}
              accessibilityHint={t('insights.summaries.drillHint')}>
              <BarChart
                data={points.map(p => ({
                  value: p.spentMinor / 100,
                  label: formatAnalyticsAxisLabel(p.period),
                  frontColor: p.overBudget
                    ? theme.colors.semantic.negative
                    : theme.colors.chart.series4,
                }))}
                barWidth={16}
                spacing={12}
                yAxisColor={theme.colors.chart.grid}
                xAxisColor={theme.colors.chart.grid}
                yAxisTextStyle={{color: theme.colors.text.tertiary}}
                xAxisLabelTextStyle={{
                  color: theme.colors.text.tertiary,
                  fontSize: theme.typography.caption.fontSize,
                }}
                rulesColor={theme.colors.border.subtle}
              />
            </View>
          ) : null}
        </View>
      )}
    </Card>
  );
}
