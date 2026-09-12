import {useCallback} from 'react';

import {useTranslation} from 'react-i18next';

import {
  formatMoney,
  money,
  type CurrencyCode,
} from '../../../domain/money/Money';
import {getNumberLocale} from '../../../i18n/formatLocale';
import {
  summarizeBuckets,
  summarizeCashFlow,
  summarizeHeatmap,
  summarizeMix,
  summarizeNamedSlices,
  summarizeOutliers,
  summarizeSpendSeries,
  summarizeStreaks,
  type BucketAmount,
  type CashFlowLikePoint,
  type NamedAmount,
  type SpendLikePoint,
} from '../chartSummaries';
import {formatAnalyticsPeriod} from '../formatAnalyticsPeriod';

import type {
  LargestTx,
  RecurringApprox,
  StreakStats,
} from '../../../db/repositories/analyticsRepository';

const DOW_BUCKET_KEYS: Record<string, string> = {
  Sun: 'insights.weekday.sun',
  Mon: 'insights.weekday.mon',
  Tue: 'insights.weekday.tue',
  Wed: 'insights.weekday.wed',
  Thu: 'insights.weekday.thu',
  Fri: 'insights.weekday.fri',
  Sat: 'insights.weekday.sat',
};

export function useAnalyticsCopy() {
  const {t} = useTranslation();
  const locale = getNumberLocale();

  const fmt = useCallback(
    (amountMinor: number, currency: CurrencyCode, signed = false) =>
      formatMoney(money(amountMinor, currency), {locale, signed}),
    [locale],
  );

  const localizeBucket = useCallback(
    (bucket: string) => {
      const key = DOW_BUCKET_KEYS[bucket];
      return key ? t(key) : bucket;
    },
    [t],
  );

  const spendSummary = useCallback(
    (points: readonly SpendLikePoint[], currency: CurrencyCode) => {
      const s = summarizeSpendSeries(points);
      if (s.kind === 'empty') {
        return {
          text: t('insights.summaries.spendEmpty'),
          hint: t('insights.summaries.chartHint'),
          muted: true,
        };
      }
      if (s.kind === 'single') {
        return {
          text: t('insights.summaries.spendSingle', {
            amount: fmt(s.amountMinor, currency),
            period: formatAnalyticsPeriod(s.period),
          }),
          hint: t('insights.summaries.chartHint'),
          muted: true,
        };
      }
      return {
        text: t('insights.summaries.spendSeries', {
          count: s.pointCount,
          total: fmt(s.totalMinor, currency),
          peakPeriod: formatAnalyticsPeriod(s.peakPeriod),
          peakAmount: fmt(s.peakMinor, currency),
        }),
        hint: t('insights.summaries.chartHint'),
        muted: false,
      };
    },
    [fmt, t],
  );

  const cashFlowSummary = useCallback(
    (points: readonly CashFlowLikePoint[], currency: CurrencyCode) => {
      const s = summarizeCashFlow(points);
      if (s.kind === 'empty') {
        return {
          text: t('insights.summaries.cashFlowEmpty'),
          hint: t('insights.summaries.chartHint'),
          muted: true,
        };
      }
      if (s.kind === 'single') {
        return {
          text: t('insights.summaries.cashFlowSingle', {
            amount: fmt(s.netMinor, currency, true),
            period: formatAnalyticsPeriod(s.period),
          }),
          hint: t('insights.summaries.chartHint'),
          muted: true,
        };
      }
      return {
        text: t('insights.summaries.cashFlowSeries', {
          count: s.pointCount,
          net: fmt(s.netTotalMinor, currency, true),
          bestPeriod: formatAnalyticsPeriod(s.bestPeriod),
          bestAmount: fmt(s.bestMinor, currency, true),
        }),
        hint: t('insights.summaries.chartHint'),
        muted: false,
      };
    },
    [fmt, t],
  );

  const categoriesSummary = useCallback(
    (slices: readonly NamedAmount[], currency: CurrencyCode) => {
      const s = summarizeNamedSlices(slices);
      if (s.kind === 'empty') {
        return {
          text: t('insights.summaries.categoriesEmpty'),
          hint: t('insights.summaries.chartHint'),
          muted: true,
        };
      }
      return {
        text: t('insights.summaries.categoriesList', {
          count: s.sliceCount,
          topName: s.topName,
          topAmount: fmt(s.topMinor, currency),
          share: s.topSharePercent,
        }),
        hint: t('insights.summaries.drillHint'),
        muted: false,
      };
    },
    [fmt, t],
  );

  const merchantsSummary = useCallback(
    (slices: readonly NamedAmount[], currency: CurrencyCode) => {
      const s = summarizeNamedSlices(slices);
      if (s.kind === 'empty') {
        return {
          text: t('insights.summaries.merchantsEmpty'),
          hint: t('insights.summaries.chartHint'),
          muted: true,
        };
      }
      return {
        text: t('insights.summaries.merchantsList', {
          count: s.sliceCount,
          topName: s.topName,
          topAmount: fmt(s.topMinor, currency),
        }),
        hint: t('insights.summaries.drillHint'),
        muted: false,
      };
    },
    [fmt, t],
  );

  const bucketsSummary = useCallback(
    (
      points: readonly BucketAmount[],
      currency: CurrencyCode,
      mode: 'dow' | 'tod',
    ) => {
      const s = summarizeBuckets(points);
      if (s.kind === 'empty') {
        return {
          text:
            mode === 'dow'
              ? t('insights.summaries.dowEmpty')
              : t('insights.summaries.todEmpty'),
          hint: t('insights.summaries.chartHint'),
          muted: true,
        };
      }
      const peakLabel =
        mode === 'dow' ? localizeBucket(s.peakBucket) : s.peakBucket;
      return {
        text: t(
          mode === 'dow'
            ? 'insights.summaries.dowPattern'
            : 'insights.summaries.todPattern',
          {
            peak: peakLabel,
            amount: fmt(s.peakMinor, currency),
            count: s.peakCount,
            buckets: s.activeBuckets,
          },
        ),
        hint: t('insights.summaries.chartHint'),
        muted: false,
      };
    },
    [fmt, localizeBucket, t],
  );

  const heatmapSummary = useCallback(
    (points: readonly SpendLikePoint[], currency: CurrencyCode) => {
      const s = summarizeHeatmap(points);
      if (s.kind === 'empty') {
        return {
          text: t('insights.summaries.heatmapEmpty'),
          hint: t('insights.summaries.chartHint'),
          muted: true,
        };
      }
      return {
        text: t('insights.summaries.heatmapGrid', {
          days: s.dayCount,
          active: s.activeDays,
          peakPeriod: formatAnalyticsPeriod(s.peakPeriod),
          peakAmount: fmt(s.peakMinor, currency),
        }),
        hint: t('insights.summaries.chartHint'),
        muted: false,
      };
    },
    [fmt, t],
  );

  const mixSummary = useCallback(
    (recurring: RecurringApprox, currency: CurrencyCode) => {
      if (
        recurring.method === 'empty' ||
        (recurring.recurringMinor === 0 && recurring.oneOffMinor === 0)
      ) {
        return {
          text: t('insights.summaries.mixEmpty'),
          hint: t('insights.summaries.chartHint'),
          muted: true,
        };
      }
      const s = summarizeMix(recurring.recurringMinor, recurring.oneOffMinor);
      if (s.kind === 'empty') {
        return {
          text: t('insights.summaries.mixEmpty'),
          hint: t('insights.summaries.chartHint'),
          muted: true,
        };
      }
      return {
        text: t('insights.summaries.mixSplit', {
          recurring: fmt(s.recurringMinor, currency),
          oneOff: fmt(s.oneOffMinor, currency),
          share: s.recurringSharePercent,
        }),
        hint: t('insights.summaries.chartHint'),
        muted: false,
      };
    },
    [fmt, t],
  );

  const outliersSummary = useCallback(
    (largest: readonly LargestTx[], currency: CurrencyCode) => {
      const s = summarizeOutliers(largest);
      if (s.kind === 'empty') {
        return {
          text: t('insights.summaries.outliersEmpty'),
          hint: t('insights.summaries.chartHint'),
          muted: true,
        };
      }
      return {
        text: t('insights.summaries.outliersList', {
          count: s.count,
          label: s.topLabel,
          amount: fmt(s.topMinor, currency),
        }),
        hint: t('insights.summaries.drillHint'),
        muted: false,
      };
    },
    [fmt, t],
  );

  const streaksSummary = useCallback(
    (streaks: StreakStats) => {
      const s = summarizeStreaks(streaks);
      if (s.activeDays === 0 && s.current === 0 && s.longest === 0) {
        return {
          text: t('insights.summaries.streaksEmpty'),
          hint: t('insights.summaries.chartHint'),
          muted: true,
        };
      }
      return {
        text: t('insights.summaries.streaksHabit', {
          current: s.current,
          longest: s.longest,
          activeDays: s.activeDays,
        }),
        hint: t('insights.summaries.chartHint'),
        muted: false,
      };
    },
    [t],
  );

  return {
    locale,
    fmt,
    localizeBucket,
    spendSummary,
    cashFlowSummary,
    categoriesSummary,
    merchantsSummary,
    bucketsSummary,
    heatmapSummary,
    mixSummary,
    outliersSummary,
    streaksSummary,
  };
}
