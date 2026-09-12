import {formatISO, parseISO, startOfDay, subDays} from 'date-fns';

/**
 * Counts consecutive calendar days (ending today or yesterday) that have ≥1
 * transaction. Pure — pass ISO date strings (`occurred_at`).
 */
export function calcTrackingStreak(
  occurredAtDates: readonly string[],
  today: Date = new Date(),
): number {
  if (occurredAtDates.length === 0) {
    return 0;
  }

  const daySet = new Set(
    occurredAtDates.map(iso => formatISO(startOfDay(parseISO(iso)), {representation: 'date'})),
  );

  const todayKey = formatISO(startOfDay(today), {representation: 'date'});
  const yesterdayKey = formatISO(startOfDay(subDays(today, 1)), {
    representation: 'date',
  });

  let cursor = startOfDay(today);
  if (!daySet.has(todayKey)) {
    if (!daySet.has(yesterdayKey)) {
      return 0;
    }
    cursor = startOfDay(subDays(today, 1));
  }

  let streak = 0;
  while (daySet.has(formatISO(cursor, {representation: 'date'}))) {
    streak += 1;
    cursor = startOfDay(subDays(cursor, 1));
  }
  return streak;
}
