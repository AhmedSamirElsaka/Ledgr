import {parseISO} from 'date-fns';

import {advanceRecurringOccurrence, type RecurringCycle} from './cycle';

export const RECURRING_SOURCE_REF_PREFIX = 'recurring:';

/** Default catch-up cap so a long-paused rule cannot explode on open. */
export const MAX_RECURRING_CATCH_UP = 36;

export type RecurringRulePlanInput = {
  id: string;
  active: boolean;
  cycle: RecurringCycle;
  customDays: number | null;
  nextOccurredAt: string;
};

export type RecurringOccurrencePlan = {
  /** Occurrence timestamps that are due (inclusive) at or before `now`. */
  dueOccurredAts: string[];
  /** Next scheduled occurrence after processing all due ones (may still be past if capped). */
  nextOccurredAt: string;
};

/**
 * Stable idempotency key for a generated occurrence.
 * Stored on `transactions.source_ref` with `source = 'recurring'`.
 */
export function occurrenceSourceRef(ruleId: string, occurredAtIso: string): string {
  return `${RECURRING_SOURCE_REF_PREFIX}${ruleId}:${occurredAtIso}`;
}

export function parseOccurrenceSourceRef(
  sourceRef: string,
): {ruleId: string; occurredAtIso: string} | null {
  if (!sourceRef.startsWith(RECURRING_SOURCE_REF_PREFIX)) {
    return null;
  }
  const rest = sourceRef.slice(RECURRING_SOURCE_REF_PREFIX.length);
  const sep = rest.indexOf(':');
  if (sep <= 0 || sep === rest.length - 1) {
    return null;
  }
  return {
    ruleId: rest.slice(0, sep),
    occurredAtIso: rest.slice(sep + 1),
  };
}

/**
 * Plans due occurrences from `nextOccurredAt` up to and including `now`.
 * Does not touch the database — callers apply idempotent inserts + advance.
 */
export function planDueOccurrences(
  rule: RecurringRulePlanInput,
  now: Date = new Date(),
  maxCatchUp: number = MAX_RECURRING_CATCH_UP,
): RecurringOccurrencePlan {
  if (!rule.active) {
    return {dueOccurredAts: [], nextOccurredAt: rule.nextOccurredAt};
  }

  const start = parseISO(rule.nextOccurredAt);
  if (Number.isNaN(start.getTime())) {
    throw new Error('Invalid next_occurred_at');
  }

  const dueOccurredAts: string[] = [];
  let cursor = start;
  let guard = 0;

  while (cursor.getTime() <= now.getTime() && guard < maxCatchUp) {
    dueOccurredAts.push(cursor.toISOString());
    cursor = parseISO(
      advanceRecurringOccurrence(cursor.toISOString(), rule.cycle, rule.customDays),
    );
    guard += 1;
  }

  return {
    dueOccurredAts,
    nextOccurredAt: cursor.toISOString(),
  };
}
