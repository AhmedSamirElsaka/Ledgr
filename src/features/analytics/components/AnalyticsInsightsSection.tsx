import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Amount} from '../../../design/primitives/Amount';
import {Card} from '../../../design/primitives/Card';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {money, type CurrencyCode} from '../../../domain/money/Money';
import {useAnalyticsCopy} from '../hooks/useAnalyticsCopy';

import {AnalyticsBalanceHistoryCard} from './AnalyticsBalanceHistoryCard';
import {AnalyticsBudgetAdherenceCard} from './AnalyticsBudgetAdherenceCard';

import type {
  AccountBalanceHistory,
  BudgetAdherenceSeries,
  LargestTx,
  RecurringApprox,
  StreakStats,
} from '../../../db/repositories/analyticsRepository';

type AnalyticsInsightsSectionProps = {
  base: CurrencyCode;
  recurring: RecurringApprox;
  largest: LargestTx[];
  streaks: StreakStats;
  balanceHistory: AccountBalanceHistory[];
  budgetAdherence: BudgetAdherenceSeries[];
  onLargestPress: (title: string) => void;
  onRecurringPress: () => void;
  onOneOffPress: () => void;
  onAccountPress: (accountId: string, title: string) => void;
  onBudgetPress: (categoryId: string | null, title: string) => void;
};

export function AnalyticsInsightsSection({
  base,
  recurring,
  largest,
  streaks,
  balanceHistory,
  budgetAdherence,
  onLargestPress,
  onRecurringPress,
  onOneOffPress,
  onAccountPress,
  onBudgetPress,
}: AnalyticsInsightsSectionProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {mixSummary, outliersSummary, streaksSummary, fmt} = useAnalyticsCopy();
  const mixCopy = mixSummary(recurring, base);
  const outliersCopy = outliersSummary(largest, base);
  const streaksCopy = streaksSummary(streaks);
  const recurringEmpty =
    recurring.method === 'empty' ||
    (recurring.recurringMinor === 0 && recurring.oneOffMinor === 0);

  return (
    <View style={{gap: theme.space[4]}}>
      <AnalyticsBalanceHistoryCard
        series={balanceHistory}
        onAccountPress={onAccountPress}
      />

      <AnalyticsBudgetAdherenceCard
        base={base}
        series={budgetAdherence}
        onBudgetPress={onBudgetPress}
      />

      <Card>
        <Text variant="label" color="tertiary">
          {t('insights.mixEyebrow')}
        </Text>
        <Text variant="headline" style={{marginTop: theme.space[2]}}>
          {t('insights.mixTitle')}
        </Text>
        {recurringEmpty ? (
          <Text
            variant="body"
            color="secondary"
            style={{marginTop: theme.space[3]}}
            accessibilityLabel={mixCopy.text}
            accessibilityHint={mixCopy.hint}>
            {t('insights.recurringEmpty')}
          </Text>
        ) : (
          <>
            <Text
              variant="caption"
              color="secondary"
              style={{marginTop: theme.space[1]}}>
              {recurring.method === 'source'
                ? t('insights.recurringMethodSource')
                : t('insights.recurringMethodHeuristic')}
            </Text>
            <Text
              variant="caption"
              color="tertiary"
              style={{marginTop: theme.space[1]}}
              accessibilityLabel={mixCopy.text}
              accessibilityHint={mixCopy.hint}>
              {mixCopy.text}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: theme.space[4],
                gap: theme.space[3],
              }}>
              <Pressable
                onPress={onRecurringPress}
                accessibilityLabel={t('insights.recurringDrillA11y')}
                style={{flex: 1, gap: theme.space[1]}}>
                <Text variant="caption" color="secondary">
                  {t('insights.recurringLabel')}
                </Text>
                <Amount value={money(recurring.recurringMinor, base)} size="sm" />
              </Pressable>
              <Pressable
                onPress={onOneOffPress}
                accessibilityLabel={t('insights.oneOffDrillA11y')}
                style={{flex: 1, gap: theme.space[1]}}>
                <Text variant="caption" color="secondary">
                  {t('insights.oneOffLabel')}
                </Text>
                <Amount value={money(recurring.oneOffMinor, base)} size="sm" />
              </Pressable>
            </View>
          </>
        )}
      </Card>

      <Card>
        <Text variant="label" color="tertiary">
          {t('insights.outliersEyebrow')}
        </Text>
        <Text variant="headline" style={{marginTop: theme.space[2]}}>
          {t('insights.largestTitle')}
        </Text>
        <Text
          variant="caption"
          color={outliersCopy.muted ? 'tertiary' : 'secondary'}
          style={{marginTop: theme.space[1]}}
          accessibilityLabel={outliersCopy.text}
          accessibilityHint={outliersCopy.hint}>
          {outliersCopy.text}
        </Text>
        <View style={{marginTop: theme.space[2]}}>
          {largest.map((tx, index) => (
            <Pressable
              key={tx.id}
              onPress={() =>
                onLargestPress(tx.merchant ?? t('insights.transactionFallback'))
              }
              accessibilityLabel={t('insights.largestRowA11y', {
                title: tx.merchant ?? tx.note ?? tx.type,
                amount: fmt(Math.abs(tx.baseAmountMinor), base),
                date: tx.occurredAt.slice(0, 10),
              })}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: theme.space[3],
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.colors.border.subtle,
              }}>
              <Text variant="body">{tx.merchant ?? tx.note ?? tx.type}</Text>
              <Amount
                value={money(Math.abs(tx.baseAmountMinor), base)}
                size="sm"
                tone={tx.type === 'income' ? 'income' : 'expense'}
              />
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text variant="label" color="tertiary">
          {t('insights.habitsEyebrow')}
        </Text>
        <Text variant="headline" style={{marginTop: theme.space[2]}}>
          {t('insights.streaksTitle')}
        </Text>
        <Text
          variant="body"
          color="secondary"
          style={{marginTop: theme.space[3]}}
          accessibilityLabel={streaksCopy.text}
          accessibilityHint={streaksCopy.hint}>
          {streaksCopy.text}
        </Text>
      </Card>
    </View>
  );
}
