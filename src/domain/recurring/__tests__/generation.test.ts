import {
  advanceRecurringOccurrence,
  isRecurringCycle,
} from '../cycle';
import {
  occurrenceSourceRef,
  parseOccurrenceSourceRef,
  planDueOccurrences,
} from '../generation';

describe('recurring cycle', () => {
  it('advances weekly / monthly / yearly / custom', () => {
    expect(advanceRecurringOccurrence('2026-01-01T12:00:00.000Z', 'weekly', null)).toBe(
      '2026-01-08T12:00:00.000Z',
    );
    expect(advanceRecurringOccurrence('2026-01-15T12:00:00.000Z', 'monthly', null)).toBe(
      '2026-02-15T12:00:00.000Z',
    );
    expect(advanceRecurringOccurrence('2026-01-10T12:00:00.000Z', 'yearly', null)).toBe(
      '2027-01-10T12:00:00.000Z',
    );
    expect(advanceRecurringOccurrence('2026-01-01T12:00:00.000Z', 'custom', 14)).toBe(
      '2026-01-15T12:00:00.000Z',
    );
  });

  it('narrows cycle strings', () => {
    expect(isRecurringCycle('weekly')).toBe(true);
    expect(isRecurringCycle('daily')).toBe(false);
  });
});

describe('recurring generation plan', () => {
  const ruleBase = {
    id: 'rule-1',
    active: true,
    cycle: 'monthly' as const,
    customDays: null,
    nextOccurredAt: '2026-01-01T12:00:00.000Z',
  };

  it('returns no dues when next is in the future', () => {
    const plan = planDueOccurrences(
      ruleBase,
      new Date('2025-12-15T00:00:00.000Z'),
    );
    expect(plan.dueOccurredAts).toEqual([]);
    expect(plan.nextOccurredAt).toBe('2026-01-01T12:00:00.000Z');
  });

  it('returns no dues when paused', () => {
    const plan = planDueOccurrences(
      {...ruleBase, active: false},
      new Date('2026-03-01T00:00:00.000Z'),
    );
    expect(plan.dueOccurredAts).toEqual([]);
    expect(plan.nextOccurredAt).toBe(ruleBase.nextOccurredAt);
  });

  it('plans catch-up dues and advances next past now', () => {
    const plan = planDueOccurrences(
      ruleBase,
      new Date('2026-03-15T00:00:00.000Z'),
    );
    expect(plan.dueOccurredAts).toEqual([
      '2026-01-01T12:00:00.000Z',
      '2026-02-01T12:00:00.000Z',
      '2026-03-01T12:00:00.000Z',
    ]);
    expect(plan.nextOccurredAt).toBe('2026-04-01T12:00:00.000Z');
  });

  it('includes an occurrence exactly at now', () => {
    const plan = planDueOccurrences(
      ruleBase,
      new Date('2026-01-01T12:00:00.000Z'),
    );
    expect(plan.dueOccurredAts).toEqual(['2026-01-01T12:00:00.000Z']);
    expect(plan.nextOccurredAt).toBe('2026-02-01T12:00:00.000Z');
  });

  it('caps catch-up to avoid runaway generation', () => {
    const plan = planDueOccurrences(
      {...ruleBase, cycle: 'custom', customDays: 1},
      new Date('2026-06-01T00:00:00.000Z'),
      3,
    );
    expect(plan.dueOccurredAts).toHaveLength(3);
    expect(plan.dueOccurredAts[0]).toBe('2026-01-01T12:00:00.000Z');
    expect(plan.nextOccurredAt).toBe('2026-01-04T12:00:00.000Z');
  });

  it('builds and parses stable occurrence keys', () => {
    const ref = occurrenceSourceRef('rule-1', '2026-01-01T12:00:00.000Z');
    expect(ref).toBe('recurring:rule-1:2026-01-01T12:00:00.000Z');
    expect(parseOccurrenceSourceRef(ref)).toEqual({
      ruleId: 'rule-1',
      occurredAtIso: '2026-01-01T12:00:00.000Z',
    });
    expect(parseOccurrenceSourceRef('sms:abc')).toBeNull();
  });

  it('keeps identical keys for the same rule + occurrence (idempotency)', () => {
    const a = occurrenceSourceRef('rule-1', '2026-01-01T12:00:00.000Z');
    const b = occurrenceSourceRef('rule-1', '2026-01-01T12:00:00.000Z');
    expect(a).toBe(b);
    expect(occurrenceSourceRef('rule-2', '2026-01-01T12:00:00.000Z')).not.toBe(a);
  });
});
