import {View} from 'react-native';

import {useTheme} from '../../../design/theme/ThemeProvider';
import {type CurrencyCode} from '../../../domain/money/Money';

import {AnalyticsActivityHeatmapCard} from './AnalyticsActivityHeatmapCard';
import {AnalyticsCashFlowCard} from './AnalyticsCashFlowCard';
import {AnalyticsDayOfWeekCard} from './AnalyticsDayOfWeekCard';
import {AnalyticsTimeOfDayCard} from './AnalyticsTimeOfDayCard';

import type {
  CashFlowPoint,
  DowTodPoint,
  SpendPoint,
} from '../../../db/repositories/analyticsRepository';

type AnalyticsPatternsSectionProps = {
  base: CurrencyCode;
  spend: SpendPoint[];
  cashFlow: CashFlowPoint[];
  dow: DowTodPoint[];
  tod: DowTodPoint[];
  chartColors: string[];
};

export function AnalyticsPatternsSection({
  base,
  spend,
  cashFlow,
  dow,
  tod,
  chartColors,
}: AnalyticsPatternsSectionProps) {
  const {theme} = useTheme();

  return (
    <View style={{gap: theme.space[4]}}>
      <AnalyticsCashFlowCard cashFlow={cashFlow} base={base} />
      <AnalyticsActivityHeatmapCard spend={spend} base={base} />
      <AnalyticsDayOfWeekCard
        dow={dow}
        chartColors={chartColors}
        base={base}
      />
      <AnalyticsTimeOfDayCard tod={tod} base={base} />
    </View>
  );
}
