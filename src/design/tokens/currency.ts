/**
 * EGP (and general) currency presentation rules for Ledgr.
 * Amounts in logic stay integer minor units — formatting is display-only.
 */

export type EgPFormatRules = {
  /** ISO code */
  code: 'EGP';
  /** Always 2 fraction digits */
  fractionDigits: 2;
  /** EN symbol */
  symbolEn: 'E£';
  /** AR symbol (suffix) */
  symbolAr: 'ج.م';
  /** Use Unicode minus U+2212 for outflows when signed */
  minusSign: '−';
  plusSign: '+';
  /** Prefer tabular lining figures in UI */
  tabularNumerals: true;
};

export const EGP_FORMAT: EgPFormatRules = {
  code: 'EGP',
  fractionDigits: 2,
  symbolEn: 'E£',
  symbolAr: 'ج.م',
  minusSign: '−',
  plusSign: '+',
  tabularNumerals: true,
};

/** Human-readable rules for docs / audits. */
export function formatEgpRules(): string {
  return [
    'EGP amounts: integer minor units (piastres); never floats in domain logic.',
    'Display: always 2 fraction digits; grouping via Intl.',
    'EN: E£ prefix; AR: ج.م suffix when locale starts with ar.',
    'Signed: − (U+2212) for negative/outflow, + for positive/inflow when signed=true.',
    'UI: fontVariant tabular-nums; trailing column alignment; never center money columns.',
  ].join('\n');
}
