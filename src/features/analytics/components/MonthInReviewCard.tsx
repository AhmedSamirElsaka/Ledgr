import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Amount} from '../../../design/primitives/Amount';
import {Button} from '../../../design/primitives/Button';
import {Card} from '../../../design/primitives/Card';
import {Skeleton} from '../../../design/primitives/Skeleton';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {money} from '../../../domain/money/Money';
import {getNumberLocale} from '../../../i18n/formatLocale';

import {ChartProseSummary} from './ChartProseSummary';

import type {MonthInReviewData} from '../hooks/useMonthInReview';

type MonthInReviewCardProps = {
  data: MonthInReviewData | null;
  loadState: 'loading' | 'ready' | 'error';
  sharing: boolean;
  onShare: () => void;
};

export function MonthInReviewCard({
  data,
  loadState,
  sharing,
  onShare,
}: MonthInReviewCardProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const locale = getNumberLocale();

  if (loadState === 'loading' && data == null) {
    return (
      <Card elevated>
        <Skeleton height={18} width="40%" />
        <View style={{height: theme.space[3]}} />
        <Skeleton height={28} width="70%" />
        <View style={{height: theme.space[4]}} />
        <Skeleton height={72} radius="md" />
      </Card>
    );
  }

  if (loadState === 'error' && data == null) {
    return (
      <Card elevated>
        <Text variant="label" color="tertiary">
          {t('insights.monthReview.eyebrow')}
        </Text>
        <Text variant="headline" style={{marginTop: theme.space[2]}}>
          {t('insights.monthReview.title')}
        </Text>
        <ChartProseSummary summary={t('common.loadFailed')} muted />
      </Card>
    );
  }

  if (data == null) {
    return null;
  }

  const netMinor = data.ie.incomeMinor - data.ie.expenseMinor;
  const topCategory = data.categories[0];
  const prose = data.empty
    ? t('insights.monthReview.emptySummary')
    : t('insights.monthReview.summaryReady', {
        month: data.monthLabel,
        expenseCount: data.stats.count,
        topCategory: topCategory?.categoryName ?? t('common.noneYet'),
      });

  return (
    <View
      accessible
      accessibilityLabel={`${t('insights.monthReview.title')}. ${prose}`}
      accessibilityHint={
        data.empty ? undefined : t('insights.monthReview.shareHint')
      }>
      <Card elevated>
        <Text variant="label" color="tertiary">
          {t('insights.monthReview.eyebrow')}
        </Text>
        <Text variant="headline" style={{marginTop: theme.space[2]}}>
          {t('insights.monthReview.title')}
        </Text>
        <Text
          variant="body"
          color="secondary"
          style={{marginTop: theme.space[1]}}>
          {data.monthLabel}
        </Text>

        <ChartProseSummary summary={prose} muted={data.empty} />

        {data.empty ? null : (
          <>
            <View
              style={{
                marginTop: theme.space[4],
                padding: theme.space[4],
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface.sunken,
                gap: theme.space[2],
              }}>
              <Text variant="caption" color="tertiary">
                {t('insights.netSummary')}
              </Text>
              <Amount
                value={money(netMinor, data.base)}
                size="lg"
                signed
                formatOptions={{locale}}
              />
              <View
                style={{
                  flexDirection: 'row',
                  gap: theme.space[4],
                  marginTop: theme.space[2],
                }}>
                <View style={{flex: 1, gap: theme.space[1]}}>
                  <Text variant="caption" color="secondary">
                    {t('insights.income')}
                  </Text>
                  <Amount
                    value={money(data.ie.incomeMinor, data.base)}
                    size="sm"
                    tone="income"
                    signed
                    formatOptions={{locale}}
                  />
                </View>
                <View style={{flex: 1, gap: theme.space[1]}}>
                  <Text variant="caption" color="secondary">
                    {t('insights.expense')}
                  </Text>
                  <Amount
                    value={money(-Math.abs(data.ie.expenseMinor), data.base)}
                    size="sm"
                    tone="expense"
                    signed
                    formatOptions={{locale}}
                  />
                </View>
              </View>
              {topCategory ? (
                <Text
                  variant="caption"
                  color="secondary"
                  style={{marginTop: theme.space[2]}}>
                  {t('insights.monthReview.topCategoryLine', {
                    name: topCategory.categoryName,
                  })}
                </Text>
              ) : null}
            </View>

            <View style={{marginTop: theme.space[4]}}>
              <Button
                label={
                  sharing
                    ? t('insights.monthReview.sharing')
                    : t('insights.monthReview.share')
                }
                onPress={onShare}
                variant="secondary"
                fullWidth
                loading={sharing}
                disabled={sharing}
                accessibilityHint={t('insights.monthReview.shareHint')}
              />
            </View>
            <Text
              variant="caption"
              color="tertiary"
              style={{marginTop: theme.space[2]}}>
              {t('insights.monthReview.privacy')}
            </Text>
          </>
        )}
      </Card>
    </View>
  );
}
