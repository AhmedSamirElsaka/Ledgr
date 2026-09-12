import {dedupeHash, isLikelyDuplicate, smsFingerprint} from '../dedupe';

describe('dedupeHash', () => {
  it('buckets by window and prefers reference when present', () => {
    const base = {
      sender: 'CIB',
      amountMinor: 9900,
      receivedAtMs: 1_700_000_000_000,
      merchant: 'Cafe',
    };
    const a = dedupeHash(base);
    const b = dedupeHash({...base, receivedAtMs: base.receivedAtMs + 60_000});
    expect(a).toBe(b);

    const withRef = dedupeHash({...base, reference: 'TX-9'});
    expect(withRef).toContain('ref:TX-9');
    expect(withRef).not.toBe(a);
  });
});

describe('isLikelyDuplicate', () => {
  it('checks membership in an existing hash set', () => {
    const input = {
      sender: 'NBE',
      amountMinor: 100,
      receivedAtMs: 1_700_000_100_000,
    };
    const hash = dedupeHash(input);
    expect(isLikelyDuplicate(new Set([hash]), input)).toBe(true);
    expect(isLikelyDuplicate(new Set(), input)).toBe(false);
  });
});

describe('smsFingerprint', () => {
  it('prefers device SMS id when available', () => {
    expect(
      smsFingerprint({
        sender: 'CIB',
        body: 'Purchase 10 EGP',
        receivedAt: '2026-03-12T10:00:00.000Z',
        deviceSmsId: '42',
      }),
    ).toBe('device:42');
  });

  it('is stable for the same sender/body/time', () => {
    const a = smsFingerprint({
      sender: ' cib ',
      body: 'Purchase 10 EGP',
      receivedAt: '2026-03-12T10:00:00.000Z',
    });
    const b = smsFingerprint({
      sender: 'CIB',
      body: 'Purchase 10 EGP',
      receivedAt: '2026-03-12T10:00:00.000Z',
    });
    expect(a).toBe(b);
    expect(a.startsWith('fp:')).toBe(true);
  });
});
