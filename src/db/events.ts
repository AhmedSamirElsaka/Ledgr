/**
 * Thin change-event bus. Repositories notify after writes; screens subscribe.
 * No polling.
 */

export type DbChangeTable =
  | 'accounts'
  | 'categories'
  | 'transactions'
  | 'tags'
  | 'transaction_tags'
  | 'budgets'
  | 'subscriptions'
  | 'sms_rules'
  | 'sms_messages'
  | 'recurring_rules'
  | 'settings'
  | 'fx_rates'
  | 'merchant_aliases';

export type DbChangeEvent = {
  table: DbChangeTable;
  /** Optional hint for targeted invalidation. */
  ids?: readonly string[];
};

type Listener = (event: DbChangeEvent) => void;

const listeners = new Set<Listener>();

export function subscribeDbChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitDbChange(event: DbChangeEvent): void {
  for (const listener of listeners) {
    listener(event);
  }
}

export function subscribeTable(
  table: DbChangeTable,
  listener: () => void,
): () => void {
  return subscribeDbChanges(event => {
    if (event.table === table) {
      listener();
    }
  });
}
