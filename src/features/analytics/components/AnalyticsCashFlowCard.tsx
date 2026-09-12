import {useTranslation} from 'react-i18next';
import {BarChart} from 'react-native-gifted-charts';

import {Card} from '../../../design/primitives/Card';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {type CurrencyCode} from '../../../domain/money/Money';
import {formatAnalyticsAxisLabel} from '../formatAnalyticsPeriod';
import {useAnalyticsCopy} from '../hooks/useAnalyticsCopy';

import {ChartProseSummary} from './ChartProseSummary';

import type {CashFlowPoint} from '../../../db/repositories/analyticsRepository';

type Props = {
  cashFlow: CashFlowPoint[];
  base: CurrencyCode;
};

export function AnalyticsCashFlowCard({cashFlow, base}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {cashFlowSummary} = useAnalyticsCopy();
  const summary = cashFlowSummary(cashFlow, base);
  const showChart = cashFlow.length > 1;

  return (
    <Card>
      <Text variant="label" color="tertiary">
        {t('insights.flowEyebrow')}
      </Text>
      <Text variant="headline" style={{marginTop: theme.space[2]}}>
        {t('insights.cashFlowTitle')}
      </Text>
      <ChartProseSummary
        summary={summary.text}
        accessibilityHint={summary.hint}
        muted={summary.muted}
      />
      {showChart ? (
        <BarChart
          data={cashFlow.map(p => ({
            value: p.netMinor / 100,
            label: formatAnalyticsAxisLabel(p.period),
            frontColor:
              p.netMinor >= 0
                ? theme.colors.semantic.positive
                : theme.colors.semantic.negative,
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
      ) : null}
    </Card>
  );
}
