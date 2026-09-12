import {useTranslation} from 'react-i18next';
import {BarChart} from 'react-native-gifted-charts';

import {Card} from '../../../design/primitives/Card';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {type CurrencyCode} from '../../../domain/money/Money';
import {useAnalyticsCopy} from '../hooks/useAnalyticsCopy';

import {ChartProseSummary} from './ChartProseSummary';

import type {DowTodPoint} from '../../../db/repositories/analyticsRepository';

type Props = {
  dow: DowTodPoint[];
  chartColors: string[];
  base: CurrencyCode;
};

export function AnalyticsDayOfWeekCard({dow, chartColors, base}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {bucketsSummary, localizeBucket} = useAnalyticsCopy();
  const summary = bucketsSummary(dow, base, 'dow');
  const hasData = dow.some(p => p.totalMinor > 0);

  return (
    <Card>
      <Text variant="label" color="tertiary">
        {t('insights.weekdayEyebrow')}
      </Text>
      <Text variant="headline" style={{marginTop: theme.space[2]}}>
        {t('insights.dayOfWeekTitle')}
      </Text>
      <ChartProseSummary
        summary={summary.text}
        accessibilityHint={summary.hint}
        muted={summary.muted}
      />
      {hasData ? (
        <BarChart
          data={dow.map((p, i) => ({
            value: p.totalMinor / 100,
            label: localizeBucket(p.bucket),
            frontColor:
              chartColors[i % chartColors.length] ?? theme.colors.chart.series1,
          }))}
          barWidth={22}
          spacing={14}
          yAxisTextStyle={{color: theme.colors.text.tertiary}}
          xAxisLabelTextStyle={{color: theme.colors.text.tertiary}}
          rulesColor={theme.colors.border.subtle}
        />
      ) : null}
    </Card>
  );
}
