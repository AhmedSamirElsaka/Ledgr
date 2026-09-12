import {View} from 'react-native';

import {useTranslation} from 'react-i18next';
import {PieChart} from 'react-native-gifted-charts';

import {Amount} from '../../../design/primitives/Amount';
import {Card} from '../../../design/primitives/Card';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {formatMoney, money, type CurrencyCode} from '../../../domain/money/Money';
import {getNumberLocale} from '../../../i18n/formatLocale';
import {useAnalyticsCopy} from '../hooks/useAnalyticsCopy';

import {ChartProseSummary} from './ChartProseSummary';

import type {
  CategorySlice,
  MerchantSlice,
} from '../../../db/repositories/analyticsRepository';

type AnalyticsBreakdownSectionProps = {
  base: CurrencyCode;
  categories: CategorySlice[];
  merchants: MerchantSlice[];
  chartColors: string[];
  onCategoryPress: (categoryId: string | null | undefined, title: string) => void;
  onMerchantPress: (merchant: string) => void;
};

export function AnalyticsBreakdownSection({
  base,
  categories,
  merchants,
  chartColors,
  onCategoryPress,
  onMerchantPress,
}: AnalyticsBreakdownSectionProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const locale = getNumberLocale();
  const {categoriesSummary, merchantsSummary} = useAnalyticsCopy();
  const catSummary = categoriesSummary(
    categories.map(c => ({name: c.categoryName, totalMinor: c.totalMinor})),
    base,
  );
  const merchSummary = merchantsSummary(
    merchants.map(m => ({
      name: m.merchant,
      totalMinor: m.totalMinor,
      count: m.count,
    })),
    base,
  );

  return (
    <View style={{gap: theme.space[4]}}>
      <Card elevated>
        <Text variant="label" color="tertiary">
          {t('insights.breakdownEyebrow')}
        </Text>
        <Text variant="headline" style={{marginTop: theme.space[2]}}>
          {t('insights.categoriesTitle')}
        </Text>
        <ChartProseSummary
          summary={catSummary.text}
          accessibilityHint={catSummary.hint}
          muted={catSummary.muted}
        />
        {categories.length === 0 ? null : (
          <>
            <View
              accessible
              accessibilityLabel={catSummary.text}
              accessibilityHint={catSummary.hint}
              style={{
                alignItems: 'center',
                marginVertical: theme.space[4],
              }}>
              <PieChart
                data={categories.slice(0, 6).map((c, i) => ({
                  value: c.totalMinor / 100,
                  color:
                    c.color ??
                    chartColors[i % chartColors.length] ??
                    theme.colors.chart.series1,
                  text: c.categoryName.slice(0, 8),
                }))}
                donut
                radius={80}
                innerRadius={48}
                innerCircleColor={theme.colors.surface.raised}
              />
            </View>
            {categories.map((c, index) => (
              <Pressable
                key={c.categoryId ?? 'none'}
                onPress={() => onCategoryPress(c.categoryId, c.categoryName)}
                accessibilityLabel={`${c.categoryName}, ${formatMoney(
                  money(c.totalMinor, base),
                  {locale},
                )}`}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: theme.space[3],
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: theme.colors.border.subtle,
                }}>
                <Text variant="body">{c.categoryName}</Text>
                <Amount
                  value={money(c.totalMinor, base)}
                  size="sm"
                  tone="expense"
                  formatOptions={{locale}}
                />
              </Pressable>
            ))}
          </>
        )}
      </Card>

      <Card elevated>
        <Text variant="label" color="tertiary">
          {t('insights.merchantsEyebrow')}
        </Text>
        <Text variant="headline" style={{marginTop: theme.space[2]}}>
          {t('insights.merchantsTitle')}
        </Text>
        <ChartProseSummary
          summary={merchSummary.text}
          accessibilityHint={merchSummary.hint}
          muted={merchSummary.muted}
        />
        <View style={{marginTop: theme.space[2]}}>
          {merchants.map((m, index) => (
            <Pressable
              key={m.merchant}
              onPress={() => onMerchantPress(m.merchant)}
              accessibilityLabel={t('insights.merchantRowA11y', {
                merchant: m.merchant,
                count: m.count,
              })}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: theme.space[3],
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.colors.border.subtle,
              }}>
              <Text variant="body">
                {t('insights.merchantRow', {merchant: m.merchant, count: m.count})}
              </Text>
              <Amount
                value={money(m.totalMinor, base)}
                size="sm"
                tone="expense"
                formatOptions={{locale}}
              />
            </Pressable>
          ))}
        </View>
      </Card>
    </View>
  );
}
