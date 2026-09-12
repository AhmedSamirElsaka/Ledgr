import {useMemo, useState} from 'react';

import {View} from 'react-native';

import {useTranslation} from 'react-i18next';
import {LineChart} from 'react-native-gifted-charts';

import {Amount} from '../../../design/primitives/Amount';
import {Card} from '../../../design/primitives/Card';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  formatMoney,
  isCurrencyCode,
  money,
  type CurrencyCode,
} from '../../../domain/money/Money';
import {getNumberLocale} from '../../../i18n/formatLocale';
import {summarizeSpendSeries} from '../chartSummaries';
import {formatAnalyticsAxisLabel, formatAnalyticsPeriod} from '../formatAnalyticsPeriod';

import {ChartProseSummary} from './ChartProseSummary';

import type {AccountBalanceHistory} from '../../../db/repositories/analyticsRepository';

type Props = {
  series: AccountBalanceHistory[];
  onAccountPress: (accountId: string, title: string) => void;
};

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

export function AnalyticsBalanceHistoryCard({series, onAccountPress}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const locale = getNumberLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    series.find(s => s.accountId === selectedId) ?? series[0] ?? null;
  const points = useMemo(() => selected?.points ?? [], [selected?.points]);
  const currency = asCurrency(selected?.currency ?? 'EGP');

  const prose = useMemo(() => {
    if (series.length === 0) {
      return {
        text: t('insights.balanceEmpty'),
        muted: true,
      };
    }
    const mapped = points.map(p => ({
      period: p.period,
      totalMinor: p.balanceMinor,
    }));
    const summary = summarizeSpendSeries(mapped);
    if (summary.kind === 'empty') {
      return {text: t('insights.balanceEmpty'), muted: true};
    }
    if (summary.kind === 'single') {
      return {
        text: t('insights.balanceSinglePointSummary', {
          account: selected?.accountName ?? '',
          amount: formatMoney(money(summary.amountMinor, currency), {locale}),
          period: formatAnalyticsPeriod(summary.period),
        }),
        muted: true,
      };
    }
    return {
      text: t('insights.balanceSeriesSummary', {
        account: selected?.accountName ?? '',
        count: summary.pointCount,
        peakPeriod: formatAnalyticsPeriod(summary.peakPeriod),
        peakAmount: formatMoney(money(summary.peakMinor, currency), {
          locale,
          signed: true,
        }),
      }),
      muted: false,
    };
  }, [currency, locale, points, selected?.accountName, series.length, t]);

  return (
    <Card>
      <Text variant="label" color="tertiary">
        {t('insights.balanceEyebrow')}
      </Text>
      <Text variant="headline" style={{marginTop: theme.space[2]}}>
        {t('insights.balanceTitle')}
      </Text>
      <Text
        variant="caption"
        color="secondary"
        style={{marginTop: theme.space[1]}}>
        {t('insights.balanceSubtitle')}
      </Text>
      <ChartProseSummary
        summary={prose.text}
        accessibilityHint={t('insights.summaries.drillHint')}
        muted={prose.muted}
      />

      {series.length === 0 ? null : (
        <View style={{marginTop: theme.space[3], gap: theme.space[3]}}>
          <View
            style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
            {series.map(item => {
              const active = item.accountId === selected?.accountId;
              return (
                <Pressable
                  key={item.accountId}
                  onPress={() => setSelectedId(item.accountId)}
                  onLongPress={() =>
                    onAccountPress(item.accountId, item.accountName)
                  }
                  accessibilityLabel={t('insights.balanceAccountA11y', {
                    name: item.accountName,
                  })}
                  style={{
                    paddingHorizontal: theme.space[3],
                    paddingVertical: theme.space[2],
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: active
                      ? theme.colors.accent.primary
                      : theme.colors.border.subtle,
                    backgroundColor: active
                      ? theme.colors.accent.primaryMuted
                      : theme.colors.surface.base,
                  }}>
                  <Text
                    variant="caption"
                    color={active ? 'primary' : 'secondary'}>
                    {item.accountName}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {points.length <= 1 ? (
            points.length === 1 ? (
              <Amount
                value={money(points[0]?.balanceMinor ?? 0, currency)}
                size="sm"
                formatOptions={{locale}}
              />
            ) : null
          ) : (
            <Pressable
              onPress={() => {
                if (selected) {
                  onAccountPress(selected.accountId, selected.accountName);
                }
              }}
              accessibilityLabel={prose.text}
              accessibilityHint={t('insights.summaries.drillHint')}>
              <LineChart
                data={points.map(p => ({
                  value: p.balanceMinor / 100,
                  label: formatAnalyticsAxisLabel(p.period),
                }))}
                color={theme.colors.text.secondary}
                thickness={2}
                hideDataPoints={points.length > 14}
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
            </Pressable>
          )}
        </View>
      )}
    </Card>
  );
}
