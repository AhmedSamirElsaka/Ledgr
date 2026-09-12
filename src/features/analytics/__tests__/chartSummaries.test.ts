import {
  summarizeBuckets,
  summarizeCashFlow,
  summarizeHeatmap,
  summarizeMix,
  summarizeNamedSlices,
  summarizeOutliers,
  summarizeSpendSeries,
  summarizeStreaks,
} from '../chartSummaries';

describe('chartSummaries', () => {
  describe('summarizeSpendSeries', () => {
    it('returns empty for no points', () => {
      expect(summarizeSpendSeries([])).toEqual({kind: 'empty'});
    });

    it('returns single for one point', () => {
      expect(
        summarizeSpendSeries([{period: '2026-09-01', totalMinor: 5000}]),
      ).toEqual({
        kind: 'single',
        period: '2026-09-01',
        amountMinor: 5000,
      });
    });

    it('returns series with peak and trough', () => {
      const result = summarizeSpendSeries([
        {period: '2026-09-01', totalMinor: 1000},
        {period: '2026-09-02', totalMinor: 9000},
        {period: '2026-09-03', totalMinor: 3000},
      ]);
      expect(result).toEqual({
        kind: 'series',
        pointCount: 3,
        totalMinor: 13000,
        peakPeriod: '2026-09-02',
        peakMinor: 9000,
        troughPeriod: '2026-09-01',
        troughMinor: 1000,
      });
    });
  });

  describe('summarizeCashFlow', () => {
    it('handles empty and single honestly', () => {
      expect(summarizeCashFlow([])).toEqual({kind: 'empty'});
      expect(
        summarizeCashFlow([{period: '2026-09-01', netMinor: -200}]),
      ).toEqual({
        kind: 'single',
        period: '2026-09-01',
        netMinor: -200,
      });
    });

    it('picks best and worst net days', () => {
      expect(
        summarizeCashFlow([
          {period: 'a', netMinor: -500},
          {period: 'b', netMinor: 800},
          {period: 'c', netMinor: 100},
        ]),
      ).toMatchObject({
        kind: 'series',
        bestPeriod: 'b',
        bestMinor: 800,
        worstPeriod: 'a',
        worstMinor: -500,
        netTotalMinor: 400,
      });
    });
  });

  describe('summarizeNamedSlices', () => {
    it('returns empty list', () => {
      expect(summarizeNamedSlices([])).toEqual({kind: 'empty'});
    });

    it('computes top share percent', () => {
      expect(
        summarizeNamedSlices([
          {name: 'Food', totalMinor: 7500},
          {name: 'Transport', totalMinor: 2500},
        ]),
      ).toEqual({
        kind: 'list',
        sliceCount: 2,
        topName: 'Food',
        topMinor: 7500,
        totalMinor: 10000,
        topSharePercent: 75,
      });
    });
  });

  describe('summarizeBuckets', () => {
    it('ignores zero buckets for empty', () => {
      expect(
        summarizeBuckets([
          {bucket: 'Sun', totalMinor: 0, count: 0},
          {bucket: 'Mon', totalMinor: 0, count: 0},
        ]),
      ).toEqual({kind: 'empty'});
    });

    it('finds peak active bucket', () => {
      expect(
        summarizeBuckets([
          {bucket: 'Sun', totalMinor: 100, count: 1},
          {bucket: 'Mon', totalMinor: 500, count: 3},
        ]),
      ).toMatchObject({
        kind: 'pattern',
        peakBucket: 'Mon',
        peakMinor: 500,
        peakCount: 3,
        activeBuckets: 2,
      });
    });
  });

  describe('summarizeHeatmap / mix / outliers / streaks', () => {
    it('summarizes heatmap activity', () => {
      expect(
        summarizeHeatmap([
          {period: 'd1', totalMinor: 0},
          {period: 'd2', totalMinor: 400},
          {period: 'd3', totalMinor: 100},
        ]),
      ).toEqual({
        kind: 'grid',
        dayCount: 3,
        activeDays: 2,
        peakPeriod: 'd2',
        peakMinor: 400,
        totalMinor: 500,
      });
    });

    it('summarizes mix and empty mix', () => {
      expect(summarizeMix(0, 0)).toEqual({kind: 'empty'});
      expect(summarizeMix(2500, 7500)).toEqual({
        kind: 'mix',
        recurringMinor: 2500,
        oneOffMinor: 7500,
        recurringSharePercent: 25,
      });
    });

    it('summarizes outliers and streaks', () => {
      expect(summarizeOutliers([])).toEqual({kind: 'empty'});
      expect(
        summarizeOutliers([
          {
            merchant: 'Cairo Airport',
            note: null,
            type: 'expense',
            baseAmountMinor: -12000,
          },
        ]),
      ).toEqual({
        kind: 'list',
        count: 1,
        topLabel: 'Cairo Airport',
        topMinor: 12000,
      });
      expect(
        summarizeStreaks({current: 2, longest: 5, activeDays: 12}),
      ).toEqual({current: 2, longest: 5, activeDays: 12});
    });
  });
});
