import {useCallback, useEffect, useRef, useState} from 'react';

import type {DatabaseRepos} from '../../../db/createRepos';

export const UNDO_DELETE_MS = 5000;

export type UndoDeleteOffer = {
  ids: readonly string[];
  count: number;
  issuedAt: number;
};

type Listener = (offer: UndoDeleteOffer | null) => void;

let currentOffer: UndoDeleteOffer | null = null;
const listeners = new Set<Listener>();

function emit(offer: UndoDeleteOffer | null): void {
  currentOffer = offer;
  listeners.forEach(listener => listener(offer));
}

/** Soft-delete already applied — publish a 5s undo window for any subscribed screen. */
export function publishUndoDelete(ids: readonly string[]): void {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) {
    return;
  }
  emit({ids: unique, count: unique.length, issuedAt: Date.now()});
}

export function clearUndoDelete(): void {
  emit(null);
}

export function getUndoDeleteOffer(): UndoDeleteOffer | null {
  return currentOffer;
}

export function subscribeUndoDelete(listener: Listener): () => void {
  listeners.add(listener);
  listener(currentOffer);
  return () => {
    listeners.delete(listener);
  };
}

export function useUndoDeleteOfferPending(): boolean {
  const [pending, setPending] = useState(() => Boolean(getUndoDeleteOffer()));
  useEffect(() => subscribeUndoDelete(offer => setPending(Boolean(offer))), []);
  return pending;
}

export function useUndoDeleteBanner(repos: DatabaseRepos) {
  const [offer, setOffer] = useState<UndoDeleteOffer | null>(() => getUndoDeleteOffer());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    clearUndoDelete();
  }, [clearTimer]);

  useEffect(() => {
    return subscribeUndoDelete(next => {
      clearTimer();
      setOffer(next);
      if (next) {
        const remaining = Math.max(0, UNDO_DELETE_MS - (Date.now() - next.issuedAt));
        timerRef.current = setTimeout(() => {
          clearUndoDelete();
        }, remaining);
      }
    });
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const undo = useCallback(async () => {
    const ids = offer?.ids ?? [];
    dismiss();
    for (const id of ids) {
      try {
        await repos.transactions.restore(id);
      } catch {
        // Best-effort restore; continue remaining ids.
      }
    }
  }, [dismiss, offer, repos.transactions]);

  return {offer, undo, dismiss};
}
