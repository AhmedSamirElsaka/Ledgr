/**
 * Stable SMS identity + richer transaction fingerprints for idempotent import.
 */

import {normalizeSmsText} from './ruleEngine';

export const DEFAULT_DEDUPE_WINDOW_MS = 5 * 60 * 1000;

export type DedupeInput = {
  sender: string;
  amountMinor: number;
  receivedAtMs: number;
  windowMs?: number;
  merchant?: string | null;
  cardLast4?: string | null;
  reference?: string | null;
};

/** Legacy bucket hash — kept for tests / migration of old rows. */
export function dedupeHash(input: DedupeInput): string {
  const windowMs = input.windowMs ?? DEFAULT_DEDUPE_WINDOW_MS;
  const bucket = Math.floor(input.receivedAtMs / windowMs);
  const sender = input.sender.trim().toUpperCase();
  const merchant = (input.merchant ?? '').trim().toUpperCase();
  const card = (input.cardLast4 ?? '').trim();
  const ref = (input.reference ?? '').trim().toUpperCase();
  if (ref) {
    return `${sender}|ref:${ref}|${input.amountMinor}`;
  }
  return `${sender}|${input.amountMinor}|${merchant}|${card}|${bucket}`;
}

export function isLikelyDuplicate(
  existingHashes: ReadonlySet<string>,
  input: DedupeInput,
): boolean {
  return existingHashes.has(dedupeHash(input));
}

/** Stable identity for the SMS row itself (re-import safe). */
export function smsFingerprint(input: {
  sender: string;
  body: string;
  receivedAt: string;
  deviceSmsId?: string | null;
}): string {
  if (input.deviceSmsId) {
    return `device:${input.deviceSmsId}`;
  }
  const sender = input.sender.trim().toUpperCase();
  const body = normalizeSmsText(input.body).toLowerCase();
  const received = input.receivedAt.trim();
  return `fp:${simpleHash(`${sender}|${received}|${body}`)}`;
}

function simpleHash(value: string): string {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    // FNV-1a style hash — intentional unsigned 32-bit ops.
    // eslint-disable-next-line no-bitwise -- hash mixing
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // eslint-disable-next-line no-bitwise -- coerce to uint32
  return (h >>> 0).toString(16).padStart(8, '0');
}
