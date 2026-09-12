/**
 * Pure chart summary facts for accessible prose.
 * Components map these discriminants to localized copy.
 */

export type SpendLikePoint = {period: string; totalMinor: number};
export type CashFlowLikePoint = {period: string; netMinor: number};
export type NamedAmount = {name: string; totalMinor: number; count?: number};
export type BucketAmount = {bucket: string; totalMinor: number; count: number};

export type EmptySingleSeries =
  | {kind: 'empty'}
  | {kind: 'single'; period: string; amountMinor: number}
  | {
      kind: 'series';
      pointCount: number;
      totalMinor: number;
      peakPeriod: string;
      peakMinor: number;
      troughPeriod: string;
      troughMinor: number;
    };

export type NetSeriesSummary =
  | {kind: 'empty'}
  | {kind: 'single'; period: string; netMinor: number}
  | {
      kind: 'series';
      pointCount: number;
      netTotalMinor: number;
      bestPeriod: string;
      bestMinor: number;
      worstPeriod: string;
      worstMinor: number;
    };

export type SliceSummary =
  | {kind: 'empty'}
  | {
      kind: 'list';
      sliceCount: number;
      topName: string;
      topMinor: number;
      totalMinor: number;
      topSharePercent: number;
    };

export type BucketSummary =
  | {kind: 'empty'}
  | {
      kind: 'pattern';
      activeBuckets: number;
      peakBucket: string;
      peakMinor: number;
      peakCount: number;
      totalMinor: number;
    };

export type MixSummary =
  | {kind: 'empty'}
  | {
      kind: 'mix';
      recurringMinor: number;
      oneOffMinor: number;
      recurringSharePercent: number;
    };

export type OutliersSummary =
  | {kind: 'empty'}
  | {
      kind: 'list';
      count: number;
      topLabel: string;
      topMinor: number;
    };

export type StreakSummary = {
  current: number;
  longest: number;
  activeDays: number;
};

export type HeatmapSummary =
  | {kind: 'empty'}
  | {
      kind: 'grid';
      dayCount: number;
      activeDays: number;
      peakPeriod: string;
      peakMinor: number;
      totalMinor: number;
    };

function pickPeak<T>(
  items: readonly T[],
  amountOf: (item: T) => number,
): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  let best = items[0]!;
  let bestAmt = amountOf(best);
  for (let i = 1; i < items.length; i += 1) {
    const item = items[i]!;
    const amt = amountOf(item);
    if (amt > bestAmt) {
      best = item;
      bestAmt = amt;
    }
  }
  return best;
}

function pickTrough<T>(
  items: readonly T[],
  amountOf: (item: T) => number,
): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  let best = items[0]!;
  let bestAmt = amountOf(best);
  for (let i = 1; i < items.length; i += 1) {
    const item = items[i]!;
    const amt = amountOf(item);
    if (amt < bestAmt) {
      best = item;
      bestAmt = amt;
    }
  }
  return best;
}

export function summarizeSpendSeries(
  points: readonly SpendLikePoint[],
): EmptySingleSeries {
  if (points.length === 0) {
    return {kind: 'empty'};
  }
  if (points.length === 1) {
    const only = points[0]!;
    return {
      kind: 'single',
      period: only.period,
      amountMinor: only.totalMinor,
    };
  }
  const peak = pickPeak(points, p => p.totalMinor)!;
  const trough = pickTrough(points, p => p.totalMinor)!;
  const totalMinor = points.reduce((sum, p) => sum + p.totalMinor, 0);
  return {
    kind: 'series',
    pointCount: points.length,
    totalMinor,
    peakPeriod: peak.period,
    peakMinor: peak.totalMinor,
    troughPeriod: trough.period,
    troughMinor: trough.totalMinor,
  };
}

export function summarizeCashFlow(
  points: readonly CashFlowLikePoint[],
): NetSeriesSummary {
  if (points.length === 0) {
    return {kind: 'empty'};
  }
  if (points.length === 1) {
    const only = points[0]!;
    return {
      kind: 'single',
      period: only.period,
      netMinor: only.netMinor,
    };
  }
  const best = pickPeak(points, p => p.netMinor)!;
  const worst = pickTrough(points, p => p.netMinor)!;
  const netTotalMinor = points.reduce((sum, p) => sum + p.netMinor, 0);
  return {
    kind: 'series',
    pointCount: points.length,
    netTotalMinor,
    bestPeriod: best.period,
    bestMinor: best.netMinor,
    worstPeriod: worst.period,
    worstMinor: worst.netMinor,
  };
}

export function summarizeNamedSlices(
  slices: readonly NamedAmount[],
): SliceSummary {
  if (slices.length === 0) {
    return {kind: 'empty'};
  }
  const totalMinor = slices.reduce((sum, s) => sum + s.totalMinor, 0);
  const top = pickPeak(slices, s => s.totalMinor)!;
  const topSharePercent =
    totalMinor <= 0 ? 0 : Math.round((top.totalMinor / totalMinor) * 100);
  return {
    kind: 'list',
    sliceCount: slices.length,
    topName: top.name,
    topMinor: top.totalMinor,
    totalMinor,
    topSharePercent,
  };
}

export function summarizeBuckets(
  points: readonly BucketAmount[],
): BucketSummary {
  const active = points.filter(p => p.totalMinor > 0);
  if (active.length === 0) {
    return {kind: 'empty'};
  }
  const peak = pickPeak(active, p => p.totalMinor)!;
  const totalMinor = active.reduce((sum, p) => sum + p.totalMinor, 0);
  return {
    kind: 'pattern',
    activeBuckets: active.length,
    peakBucket: peak.bucket,
    peakMinor: peak.totalMinor,
    peakCount: peak.count,
    totalMinor,
  };
}

export function summarizeHeatmap(
  points: readonly SpendLikePoint[],
): HeatmapSummary {
  if (points.length === 0) {
    return {kind: 'empty'};
  }
  const active = points.filter(p => p.totalMinor > 0);
  const peak = pickPeak(points, p => p.totalMinor)!;
  const totalMinor = points.reduce((sum, p) => sum + p.totalMinor, 0);
  return {
    kind: 'grid',
    dayCount: points.length,
    activeDays: active.length,
    peakPeriod: peak.period,
    peakMinor: peak.totalMinor,
    totalMinor,
  };
}

export function summarizeMix(
  recurringMinor: number,
  oneOffMinor: number,
): MixSummary {
  const total = recurringMinor + oneOffMinor;
  if (total <= 0) {
    return {kind: 'empty'};
  }
  return {
    kind: 'mix',
    recurringMinor,
    oneOffMinor,
    recurringSharePercent: Math.round((recurringMinor / total) * 100),
  };
}

export function summarizeOutliers(
  items: ReadonlyArray<{
    merchant: string | null;
    note: string | null;
    type: string;
    baseAmountMinor: number;
  }>,
): OutliersSummary {
  if (items.length === 0) {
    return {kind: 'empty'};
  }
  const top = items[0]!;
  return {
    kind: 'list',
    count: items.length,
    topLabel: top.merchant ?? top.note ?? top.type,
    topMinor: Math.abs(top.baseAmountMinor),
  };
}

export function summarizeStreaks(input: {
  current: number;
  longest: number;
  activeDays: number;
}): StreakSummary {
  return {
    current: input.current,
    longest: input.longest,
    activeDays: input.activeDays,
  };
}
