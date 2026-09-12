import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Card} from '../../../design/primitives/Card';
import {Input} from '../../../design/primitives/Input';
import {SegmentedControl} from '../../../design/primitives/SegmentedControl';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {periodLabelKey} from '../../../domain/period/periodRange';
import {type PeriodFilter} from '../../../store/uiStore';

const PERIODS: PeriodFilter[] = [
  '7d',
  '30d',
  '90d',
  'week',
  'month',
  'year',
  'all',
  'custom',
];

type AnalyticsPeriodChipsProps = {
  period: PeriodFilter;
  onSelectPeriod: (period: PeriodFilter) => void;
  draftFrom: string;
  draftTo: string;
  onDraftFromChange: (value: string) => void;
  onDraftToChange: (value: string) => void;
  onApplyCustomRange: () => void;
};

export function AnalyticsPeriodChips({
  period,
  onSelectPeriod,
  draftFrom,
  draftTo,
  onDraftFromChange,
  onDraftToChange,
  onApplyCustomRange,
}: AnalyticsPeriodChipsProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  return (
    <View style={{gap: theme.space[3]}}>
      <View style={{gap: theme.space[2]}}>
        <Text variant="label" color="tertiary">
          {t('insights.periodLabel', {period: t(periodLabelKey(period))})}
        </Text>
        <SegmentedControl
          options={PERIODS.map(p => ({id: p, label: t(periodLabelKey(p))}))}
          value={period}
          onChange={onSelectPeriod}
          accessibilityLabel={t('insights.periodLabel', {
            period: t(periodLabelKey(period)),
          })}
        />
      </View>
      {period === 'custom' ? (
        <Card>
          <Text variant="label" color="tertiary">
            {t('insights.customRange')}
          </Text>
          <View style={{height: theme.space[3]}} />
          <Input
            label={t('insights.from')}
            value={draftFrom}
            onChangeText={onDraftFromChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={{height: theme.space[2]}} />
          <Input
            label={t('insights.to')}
            value={draftTo}
            onChangeText={onDraftToChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={{height: theme.space[4]}} />
          <Button
            label={t('insights.applyRange')}
            onPress={onApplyCustomRange}
            fullWidth
          />
        </Card>
      ) : null}
    </View>
  );
}
