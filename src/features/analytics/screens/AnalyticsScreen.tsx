import {useMemo, useState} from 'react';

import {ScrollView, RefreshControl, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {EmptyIllustration} from '../../../design/motion/EmptyIllustration';
import {ScreenEnter} from '../../../design/motion/ScreenEnter';
import {Button} from '../../../design/primitives/Button';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {ErrorState} from '../../../design/primitives/ErrorState';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Skeleton} from '../../../design/primitives/Skeleton';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {AnalyticsBreakdownSection} from '../components/AnalyticsBreakdownSection';
import {AnalyticsInsightsSection} from '../components/AnalyticsInsightsSection';
import {AnalyticsOverviewSection} from '../components/AnalyticsOverviewSection';
import {AnalyticsPatternsSection} from '../components/AnalyticsPatternsSection';
import {AnalyticsPeriodChips} from '../components/AnalyticsPeriodChips';
import {MonthInReviewCard} from '../components/MonthInReviewCard';
import {useAnalyticsScreen} from '../hooks/useAnalyticsScreen';
import {useMonthInReview} from '../hooks/useMonthInReview';

import type {
  AnalyticsStackParamList,
  RootTabParamList,
} from '../../../app/navigation/types';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

type AnalyticsNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<AnalyticsStackParamList, 'AnalyticsMain'>,
  BottomTabNavigationProp<RootTabParamList>
>;

export function AnalyticsScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AnalyticsNavigation>();
  const [showDetails, setShowDetails] = useState(false);
  const {
    period,
    setPeriod,
    draftFrom,
    setDraftFrom,
    draftTo,
    setDraftTo,
    applyCustomRange,
    base,
    spend,
    categories,
    merchants,
    ie,
    cashFlow,
    dow,
    tod,
    stats,
    largest,
    recurring,
    streaks,
    balanceHistory,
    budgetAdherence,
    empty,
    loadState,
    refreshing,
    onRefresh,
    onRetry,
  } = useAnalyticsScreen();
  const monthReview = useMonthInReview();

  const chartColors = useMemo(
    () => [
      theme.colors.chart.series1,
      theme.colors.chart.series2,
      theme.colors.chart.series3,
      theme.colors.chart.series4,
      theme.colors.chart.series5,
      theme.colors.chart.series6,
    ],
    [theme.colors.chart],
  );

  return (
    <ScreenEnter>
      <ScreenBackdrop washHeight={300}>
        {loadState === 'loading' ? (
          <View
            style={{
              paddingTop: insets.top + theme.space[5],
              paddingHorizontal: theme.space[4],
              gap: theme.space[3],
            }}>
            <Skeleton height={24} width="30%" />
            <Skeleton height={40} width="55%" />
            <Skeleton height={120} radius="lg" />
            <Skeleton height={160} radius="lg" />
          </View>
        ) : loadState === 'error' && empty ? (
          <ErrorState
            title={t('common.errorTitle')}
            message={t('common.loadFailed')}
            retryLabel={t('common.retry')}
            onRetry={onRetry}
          />
        ) : (
          <ScrollView
            style={{flex: 1}}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.accent.primary}
              />
            }
            contentContainerStyle={{
              paddingTop: insets.top + theme.space[5],
              paddingHorizontal: theme.space[4],
              paddingBottom: insets.bottom + theme.space[8],
              gap: theme.space[5],
            }}>
            <View style={{gap: theme.space[3]}}>
              <Text variant="label" color="tertiary">
                {t('insights.eyebrow')}
              </Text>
              <Text variant="display">{t('insights.title')}</Text>
              <AnalyticsPeriodChips
                period={period}
                onSelectPeriod={setPeriod}
                draftFrom={draftFrom}
                draftTo={draftTo}
                onDraftFromChange={setDraftFrom}
                onDraftToChange={setDraftTo}
                onApplyCustomRange={applyCustomRange}
              />
            </View>

            <MonthInReviewCard
              data={monthReview.data}
              loadState={monthReview.loadState}
              sharing={monthReview.sharing}
              onShare={() => {
                monthReview.shareReport().catch(() => undefined);
              }}
            />

            {empty ? (
              <EmptyState
                title={t('insights.emptyTitle')}
                description={t('insights.emptyBody')}
                actionLabel={t('insights.emptyAction')}
                onAction={() =>
                  navigation.navigate('Home', {screen: 'AddTransaction'})
                }
                illustration={
                  <EmptyIllustration name="ChartPie" secondaryName="Receipt" />
                }
              />
            ) : (
              <>
                <AnalyticsOverviewSection
                  base={base}
                  ie={ie}
                  stats={stats}
                  spend={spend}
                />
                <AnalyticsBreakdownSection
                  base={base}
                  categories={categories}
                  merchants={merchants}
                  chartColors={chartColors}
                  onCategoryPress={(categoryId, title) =>
                    navigation.navigate('AnalyticsTransactions', {
                      categoryId: categoryId ?? undefined,
                      title,
                    })
                  }
                  onMerchantPress={merchant =>
                    navigation.navigate('AnalyticsTransactions', {
                      merchant,
                      title: merchant,
                    })
                  }
                />
                <Button
                  label={
                    showDetails
                      ? t('insights.hideDetails')
                      : t('insights.showDetails')
                  }
                  variant="secondary"
                  fullWidth
                  onPress={() => setShowDetails(prev => !prev)}
                />
                {showDetails ? (
                  <>
                    <AnalyticsPatternsSection
                      base={base}
                      spend={spend}
                      cashFlow={cashFlow}
                      dow={dow}
                      tod={tod}
                      chartColors={chartColors}
                    />
                    <AnalyticsInsightsSection
                      base={base}
                      recurring={recurring}
                      largest={largest}
                      streaks={streaks}
                      balanceHistory={balanceHistory}
                      budgetAdherence={budgetAdherence}
                      onLargestPress={title =>
                        navigation.navigate('AnalyticsTransactions', {title})
                      }
                      onRecurringPress={() =>
                        navigation.navigate('AnalyticsTransactions', {
                          source: 'recurring',
                          title: t('insights.mixTitle'),
                        })
                      }
                      onOneOffPress={() =>
                        navigation.navigate('AnalyticsTransactions', {
                          excludeSource:
                            recurring.method === 'source'
                              ? 'recurring'
                              : undefined,
                          title: t('insights.oneOffLabel'),
                        })
                      }
                      onAccountPress={(accountId, title) =>
                        navigation.navigate('AnalyticsTransactions', {
                          accountId,
                          title,
                        })
                      }
                      onBudgetPress={(categoryId, title) =>
                        navigation.navigate('AnalyticsTransactions', {
                          categoryId: categoryId ?? undefined,
                          title,
                        })
                      }
                    />
                  </>
                ) : null}
              </>
            )}
          </ScrollView>
        )}
      </ScreenBackdrop>
    </ScreenEnter>
  );
}
