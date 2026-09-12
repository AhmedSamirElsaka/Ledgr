import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Card} from '../../../design/primitives/Card';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {type CurrencyCode} from '../../../domain/money/Money';
import {formatAnalyticsPeriod} from '../formatAnalyticsPeriod';
import {useAnalyticsCopy} from '../hooks/useAnalyticsCopy';

import {ChartProseSummary} from './ChartProseSummary';

import type {SpendPoint} from '../../../db/repositories/analyticsRepository';

type Props = {
  spend: SpendPoint[];
  base: CurrencyCode;
};

export function AnalyticsActivityHeatmapCard({spend, base}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {heatmapSummary, fmt} = useAnalyticsCopy();
  const summary = heatmapSummary(spend, base);
  const heatmapMax = Math.max(...spend.map(p => p.totalMinor), 1);
  const cells = spend.slice(-42);

  return (
    <Card>
      <Text variant="label" color="tertiary">
        {t('insights.activityEyebrow')}
      </Text>
      <Text variant="headline" style={{marginTop: theme.space[2]}}>
        {t('insights.heatmapTitle')}
      </Text>
      <ChartProseSummary
        summary={summary.text}
        accessibilityHint={summary.hint}
        muted={summary.muted}
      />
      {cells.length === 0 ? null : (
        <View
          accessible
          accessibilityLabel={summary.text}
          accessibilityHint={summary.hint}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space[1],
            marginTop: theme.space[3],
          }}>
          {cells.map(p => {
            const intensity = p.totalMinor / heatmapMax;
            return (
              <View
                key={p.period}
                accessible
                accessibilityLabel={t('insights.heatmapCellA11y', {
                  period: formatAnalyticsPeriod(p.period),
                  amount: fmt(p.totalMinor, base),
                })}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.accent.primary,
                  opacity: 0.15 + intensity * 0.85,
                }}
              />
            );
          })}
        </View>
      )}
    </Card>
  );
}
