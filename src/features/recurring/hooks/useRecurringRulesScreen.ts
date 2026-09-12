import {useCallback, useEffect, useState} from 'react';

import {useRepos} from '../../../db/DatabaseProvider';
import {subscribeTable} from '../../../db/events';
import {RECURRING_REMINDER_DAYS_BEFORE} from '../../../db/recurring/generateDueRecurring';
import {isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';
import {
  cancelRecurringReminder,
  scheduleRecurringReminder,
} from '../../../lib/notifications';

import type {RecurringRuleRow} from '../../../db/repositories/recurringRulesRepository';

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

export function useRecurringRulesScreen() {
  const repos = useRepos();
  const [items, setItems] = useState<RecurringRuleRow[]>([]);
  const [base, setBase] = useState<CurrencyCode>('EGP');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const baseCur = (await repos.settings.get('base_currency')) ?? 'EGP';
      setBase(asCurrency(baseCur));
      setItems(await repos.recurringRules.listAll());
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [repos]);

  useEffect(() => {
    refresh().catch(() => undefined);
    return subscribeTable('recurring_rules', () => {
      refresh().catch(() => undefined);
    });
  }, [refresh]);

  const onToggleActive = useCallback(
    async (id: string, active: boolean) => {
      const updated = await repos.recurringRules.setActive(id, active);
      if (updated.active === 1) {
        await scheduleRecurringReminder({
          id: updated.id,
          name: updated.name,
          dueAtMs: Date.parse(updated.next_occurred_at),
          daysBefore: RECURRING_REMINDER_DAYS_BEFORE,
        });
      } else {
        await cancelRecurringReminder(updated.id);
      }
    },
    [repos],
  );

  return {items, base, loading, loadError, refresh, onToggleActive};
}
