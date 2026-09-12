/** 4pt spacing grid. Use theme.space.* — never raw numbers in layouts. */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpaceToken = keyof typeof space;

/** Minimum interactive target (pt). */
export const touchTarget = 44;
