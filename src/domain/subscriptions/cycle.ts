import {addDays, addMonths, addYears, parseISO} from 'date-fns';

export type SubscriptionCycle = 'monthly' | 'yearly' | 'custom';

/**
 * Predicts the next due date after `from` (exclusive of from if it equals current due).
 * If `currentDue` is in the future relative to `from`, returns currentDue.
 */
export function predictNextDueDate(
  currentDueIso: string,
  cycle: SubscriptionCycle,
  customDays: number | null | undefined,
  from: Date = new Date(),
): string {
  let due = parseISO(currentDueIso);
  if (Number.isNaN(due.getTime())) {
    throw new Error('Invalid next_due_date');
  }

  const advance = (d: Date): Date => {
    switch (cycle) {
      case 'yearly':
        return addYears(d, 1);
      case 'custom': {
        const days = customDays && customDays > 0 ? customDays : 30;
        return addDays(d, days);
      }
      case 'monthly':
      default:
        return addMonths(d, 1);
    }
  };

  // Roll forward until due is strictly after `from` start-of-day comparison via timestamp.
  let guard = 0;
  while (due.getTime() <= from.getTime() && guard < 240) {
    due = advance(due);
    guard += 1;
  }
  return due.toISOString();
}

/** Normalize a cycle cost to a monthly minor-unit estimate. */
export function toMonthlyMinor(
  amountMinor: number,
  cycle: SubscriptionCycle,
  customDays: number | null | undefined,
): number {
  switch (cycle) {
    case 'yearly':
      return Math.round(amountMinor / 12);
    case 'custom': {
      const days = customDays && customDays > 0 ? customDays : 30;
      return Math.round((amountMinor * 30) / days);
    }
    case 'monthly':
    default:
      return amountMinor;
  }
}

export function toYearlyMinor(
  amountMinor: number,
  cycle: SubscriptionCycle,
  customDays: number | null | undefined,
): number {
  return toMonthlyMinor(amountMinor, cycle, customDays) * 12;
}
