import {addDays, addMonths, addWeeks, addYears, parseISO} from 'date-fns';

export type RecurringCycle = 'weekly' | 'monthly' | 'yearly' | 'custom';

export function isRecurringCycle(value: string): value is RecurringCycle {
  return (
    value === 'weekly' ||
    value === 'monthly' ||
    value === 'yearly' ||
    value === 'custom'
  );
}

/** Advances one occurrence from `fromIso` (inclusive start of that cycle step). */
export function advanceRecurringOccurrence(
  fromIso: string,
  cycle: RecurringCycle,
  customDays: number | null | undefined,
): string {
  const from = parseISO(fromIso);
  if (Number.isNaN(from.getTime())) {
    throw new Error('Invalid occurrence timestamp');
  }

  switch (cycle) {
    case 'weekly':
      return addWeeks(from, 1).toISOString();
    case 'yearly':
      return addYears(from, 1).toISOString();
    case 'custom': {
      const days = customDays && customDays > 0 ? customDays : 30;
      return addDays(from, days).toISOString();
    }
    case 'monthly':
    default:
      return addMonths(from, 1).toISOString();
  }
}
