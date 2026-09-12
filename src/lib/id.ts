/** RFC4122-ish UUID v4 — fine for single-device local IDs. */
export function createId(): string {
  const bytes = Array.from({length: 16}, () => Math.floor(Math.random() * 256));
  const at = bytes[6];
  const at8 = bytes[8];
  if (at === undefined || at8 === undefined) {
    throw new Error('Failed to generate id entropy');
  }
  bytes[6] = (at % 16) + 64; // version 4
  bytes[8] = (at8 % 64) + 128; // variant 10

  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
