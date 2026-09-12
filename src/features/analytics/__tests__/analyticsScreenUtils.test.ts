import {
  asAnalyticsCurrency,
  resolveAnalyticsRange,
} from '../hooks/analyticsScreenUtils';

describe('asAnalyticsCurrency', () => {
  it('falls back to EGP for unknown codes', () => {
    expect(asAnalyticsCurrency('EGP')).toBe('EGP');
    expect(asAnalyticsCurrency('NOPE')).toBe('EGP');
  });
});

describe('resolveAnalyticsRange', () => {
  it('returns an ISO window for preset periods', () => {
    const range = resolveAnalyticsRange('30d', '', '');
    expect(range.fromIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(range.toIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Date.parse(range.toIso)).toBeGreaterThan(Date.parse(range.fromIso));
  });

  it('falls back when period has no bounds', () => {
    const range = resolveAnalyticsRange('all', '', '');
    expect(range.fromIso).toBe('1970-01-01T00:00:00.000Z');
    expect(Date.parse(range.toIso)).not.toBeNaN();
  });
});
