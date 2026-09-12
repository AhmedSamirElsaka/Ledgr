/** Motion tokens — keep animations ≤300ms; ThemeProvider zeros ms when reduce-motion. */
export const duration = {
  instant: 0,
  fast: 120,
  normal: 200,
  slow: 280,
} as const;

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

export const spring = {
  snappy: {damping: 24, stiffness: 360, mass: 0.8},
  soft: {damping: 28, stiffness: 220, mass: 1},
} as const;

export const motion = {
  duration,
  easing,
  spring,
  maxMs: 300,
} as const;
