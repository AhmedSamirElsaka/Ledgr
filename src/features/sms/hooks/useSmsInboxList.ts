import {useCallback, useEffect, useState} from 'react';

import {useRepos} from '../../../db/DatabaseProvider';
import {subscribeTable} from '../../../db/events';

import type {SmsMessageRow} from '../../../db/repositories/smsMessagesRepository';

export type SmsInboxListState = 'loading' | 'ready' | 'error';

export type SmsInboxListItem = SmsMessageRow & {
  matchedRuleName: string | null;
};

export function useSmsInboxList() {
  const repos = useRepos();
  const [items, setItems] = useState<SmsInboxListItem[]>([]);
  const [state, setState] = useState<SmsInboxListState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setState(prev => (prev === 'ready' ? 'ready' : 'loading'));
    setErrorMessage(null);
    try {
      const [rows, rules] = await Promise.all([
        repos.smsMessages.listByStatus('needs_review'),
        repos.smsRules.listAll(),
      ]);
      const ruleNames = new Map(rules.map(rule => [rule.id, rule.name]));
      setItems(
        rows.map(row => ({
          ...row,
          matchedRuleName: row.matched_rule_id
            ? (ruleNames.get(row.matched_rule_id) ?? null)
            : null,
        })),
      );
      setState('ready');
    } catch (err) {
      setItems([]);
      setState('error');
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  }, [repos]);

  useEffect(() => {
    refresh().catch(() => undefined);
    return subscribeTable('sms_messages', () => {
      refresh().catch(() => undefined);
    });
  }, [refresh]);

  return {items, refresh, state, errorMessage};
}
