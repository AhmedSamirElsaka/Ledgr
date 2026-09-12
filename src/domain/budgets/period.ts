import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  formatISO,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export type BudgetPeriodKind = 'weekly' | 'monthly' | 'custom';

export type PeriodBounds = {
  start: Date;
  end: Date;
};

/** Inclusive calendar bounds for the budget window containing `ref`. */
export function getBudgetPeriodBounds(
  period: BudgetPeriodKind,
  startDateIso: string,
  endDateIso: string | null,
  ref: Date = new Date(),
): PeriodBounds {
  const anchor = startOfDay(parseISO(startDateIso));

  if (period === 'custom') {
    const end = endDateIso
      ? endOfDay(parseISO(endDateIso))
      : endOfDay(addDays(anchor, 29));
    return {start: anchor, end};
  }

  if (period === 'weekly') {
    // Align to week containing ref, relative to ISO week (Mon start).
    const weekStart = startOfWeek(ref, {weekStartsOn: 1});
    const weekEnd = endOfWeek(ref, {weekStartsOn: 1});
    // If budget started mid-week later than this window, clamp.
    const start = weekStart < anchor ? anchor : weekStart;
    return {start: startOfDay(start), end: endOfDay(weekEnd)};
  }

  // monthly
  const monthStart = startOfMonth(ref);
  const monthEnd = endOfMonth(ref);
  const start = monthStart < anchor ? anchor : monthStart;
  return {start: startOfDay(start), end: endOfDay(monthEnd)};
}

export function periodBoundsToIso(bounds: PeriodBounds): {
  startIso: string;
  endIso: string;
} {
  return {
    startIso: bounds.start.toISOString(),
    endIso: bounds.end.toISOString(),
  };
}

export function formatPeriodLabel(bounds: PeriodBounds): string {
  const a = formatISO(bounds.start, {representation: 'date'});
  const b = formatISO(bounds.end, {representation: 'date'});
  return `${a} → ${b}`;
}

/**
 * Remaining budget after spend, optionally carrying unused from prior period.
 * All values are integer minor units.
 */
export function computeBudgetRemaining(input: {
  amountMinor: number;
  spentMinor: number;
  previousRemainingMinor: number;
  rollover: boolean;
}): number {
  const carried = input.rollover ? Math.max(0, input.previousRemainingMinor) : 0;
  return input.amountMinor + carried - input.spentMinor;
}

export function computeBudgetProgress(input: {
  amountMinor: number;
  spentMinor: number;
  previousRemainingMinor: number;
  rollover: boolean;
}): {remainingMinor: number; progress: number; overBudget: boolean} {
  const envelope =
    input.amountMinor +
    (input.rollover ? Math.max(0, input.previousRemainingMinor) : 0);
  const remainingMinor = envelope - input.spentMinor;
  const progress =
    envelope <= 0 ? (input.spentMinor > 0 ? 1 : 0) : Math.min(1, input.spentMinor / envelope);
  return {
    remainingMinor,
    progress,
    overBudget: remainingMinor < 0,
  };
}
