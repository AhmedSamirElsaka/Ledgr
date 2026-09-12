import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Card} from '../../../design/primitives/Card';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {type CurrencyCode} from '../../../domain/money/Money';
import {useAnalyticsCopy} from '../hooks/useAnalyticsCopy';

import {ChartProseSummary} from './ChartProseSummary';

import type {DowTodPoint} from '../../../db/repositories/analyticsRepository';

type Props = {
  tod: DowTodPoint[];
  base: CurrencyCode;
};

export function AnalyticsTimeOfDayCard({tod, base}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {bucketsSummary, fmt} = useAnalyticsCopy();
  const summary = bucketsSummary(tod, base, 'tod');
  const maxTod = Math.max(...tod.map(x => x.totalMinor), 1);
  const active = tod.filter(row => row.totalMinor > 0).slice(0, 8);

  return (
    <Card>
      <Text variant="label" color="tertiary">
        {t('insights.clockEyebrow')}
      </Text>
      <Text variant="headline" style={{marginTop: theme.space[2]}}>
        {t('insights.timeOfDayTitle')}
      </Text>
      <ChartProseSummary
        summary={summary.text}
        accessibilityHint={summary.hint}
        muted={summary.muted}
      />
      <View
        accessible
        accessibilityLabel={summary.text}
        accessibilityHint={summary.hint}
        style={{gap: theme.space[3], marginTop: theme.space[3]}}>
        {active.map(row => (
          <View key={row.bucket} style={{gap: theme.space[1]}}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <Text
                variant="caption"
                accessibilityLabel={t('insights.todRowA11y', {
                  hour: row.bucket,
                  amount: fmt(row.totalMinor, base),
                  count: row.count,
                })}>
                {row.bucket}
              </Text>
              <Text variant="caption" color="tertiary">
                {t('insights.todTxCount', {count: row.count})}
              </Text>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.surface.sunken,
                overflow: 'hidden',
              }}>
              <View
                style={{
                  width: `${Math.round((row.totalMinor / maxTod) * 100)}%`,
                  height: '100%',
                  backgroundColor: theme.colors.chart.series4,
                }}
              />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
