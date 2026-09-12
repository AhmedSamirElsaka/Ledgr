import {isCurrencyCode, type CurrencyCode} from '../../domain/money/Money';
import {occurrenceSourceRef, planDueOccurrences} from '../../domain/recurring/generation';
import {
  cancelRecurringReminder,
  scheduleRecurringReminder,
} from '../../lib/notifications';
import {
  InvalidFxRateError,
  MissingFxRateError,
  resolveFxRateToBase,
} from '../repositories/fxRatesRepository';

import type {FxRatesRepository} from '../repositories/fxRatesRepository';
import type {RecurringRulesRepository} from '../repositories/recurringRulesRepository';
import type {SettingsRepository} from '../repositories/settingsRepository';
import type {TransactionsRepository} from '../repositories/transactionsRepository';

/** Local reminder lead time for upcoming recurring dues (days). */
export const RECURRING_REMINDER_DAYS_BEFORE = 1;

export type RecurringGenerateRepos = {
  recurringRules: Pick<
    RecurringRulesRepository,
    'listDue' | 'listAll' | 'setNextOccurredAt'
  >;
  transactions: Pick<TransactionsRepository, 'create' | 'findBySourceRef'>;
  settings: Pick<SettingsRepository, 'get'>;
  fxRates: Pick<FxRatesRepository, 'getRate'>;
};

export type GenerateDueRecurringResult = {
  created: number;
  skippedExisting: number;
  rulesAdvanced: number;
  blockedByFx: number;
};

function asCurrency(code: string | null | undefined, fallback: string): CurrencyCode {
  if (code && isCurrencyCode(code)) {
    return code;
  }
  if (isCurrencyCode(fallback)) {
    return fallback;
  }
  return 'EGP';
}

/**
 * Generates due recurring-rule occurrences into transactions (idempotent via source_ref).
 * Safe to call on every app open.
 */
export async function generateDueRecurring(
  repos: RecurringGenerateRepos,
  now: Date = new Date(),
): Promise<GenerateDueRecurringResult> {
  const result: GenerateDueRecurringResult = {
    created: 0,
    skippedExisting: 0,
    rulesAdvanced: 0,
    blockedByFx: 0,
  };

  const asOfIso = now.toISOString();
  const dueRules = await repos.recurringRules.listDue(asOfIso);
  const baseCurrency = asCurrency(await repos.settings.get('base_currency'), 'EGP');

  for (const rule of dueRules) {
    const plan = planDueOccurrences(
      {
        id: rule.id,
        active: rule.active === 1,
        cycle: rule.cycle,
        customDays: rule.custom_days,
        nextOccurredAt: rule.next_occurred_at,
      },
      now,
    );

    if (plan.dueOccurredAts.length === 0) {
      continue;
    }

    const currency = asCurrency(rule.currency, baseCurrency);
    let rateToBase: number;
    try {
      rateToBase = await resolveFxRateToBase(repos.fxRates, currency, baseCurrency);
    } catch (error) {
      if (error instanceof MissingFxRateError || error instanceof InvalidFxRateError) {
        result.blockedByFx += 1;
        continue;
      }
      throw error;
    }

    let nextOccurredAt = plan.nextOccurredAt;
    let createdOrSkipped = 0;

    for (const occurredAt of plan.dueOccurredAts) {
      const sourceRef = occurrenceSourceRef(rule.id, occurredAt);
      const existing = await repos.transactions.findBySourceRef(sourceRef);
      if (existing) {
        result.skippedExisting += 1;
        createdOrSkipped += 1;
        continue;
      }

      await repos.transactions.create({
        accountId: rule.account_id,
        categoryId: rule.category_id,
        amountMinor: rule.amount_minor,
        currency,
        fxRateToBase: rateToBase,
        baseAmountMinor: Math.round(rule.amount_minor * rateToBase),
        type: rule.type,
        note: rule.note,
        merchant: rule.name,
        occurredAt,
        source: 'recurring',
        sourceRef,
      });
      result.created += 1;
      createdOrSkipped += 1;
    }

    if (createdOrSkipped === plan.dueOccurredAts.length) {
      await repos.recurringRules.setNextOccurredAt(rule.id, nextOccurredAt);
      result.rulesAdvanced += 1;
    } else {
      // Partial failure mid-loop should not happen today; keep pointer on first unfinished.
      const unfinished = plan.dueOccurredAts[createdOrSkipped];
      if (unfinished) {
        nextOccurredAt = unfinished;
        await repos.recurringRules.setNextOccurredAt(rule.id, unfinished);
        result.rulesAdvanced += 1;
      }
    }
  }

  await refreshRecurringReminders(repos);
  return result;
}

/** Schedules/cancels local reminders for rules' next dues. */
export async function refreshRecurringReminders(
  repos: Pick<RecurringGenerateRepos, 'recurringRules'>,
): Promise<void> {
  const rules = await repos.recurringRules.listAll();
  for (const rule of rules) {
    if (rule.active !== 1) {
      await cancelRecurringReminder(rule.id);
      continue;
    }
    const dueAtMs = Date.parse(rule.next_occurred_at);
    if (!Number.isFinite(dueAtMs)) {
      await cancelRecurringReminder(rule.id);
      continue;
    }
    await scheduleRecurringReminder({
      id: rule.id,
      name: rule.name,
      dueAtMs,
      daysBefore: RECURRING_REMINDER_DAYS_BEFORE,
    });
  }
}
