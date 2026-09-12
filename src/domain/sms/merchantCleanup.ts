/**
 * Normalizes raw merchant strings from SMS bodies for display and matching.
 */

const CODE_RE = /\b(?:AUTH|REF|TXN|TRX|ID)[:#-]?\s*[A-Z0-9-]{4,}\b/gi;
const MULTI_SPACE_RE = /\s+/g;
const NON_ALNUM_EDGE_RE = /^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g;

export function cleanMerchant(raw: string): string {
  const stripped = raw
    .replace(CODE_RE, ' ')
    .replace(/[*#]+/g, ' ')
    .replace(MULTI_SPACE_RE, ' ')
    .replace(NON_ALNUM_EDGE_RE, '')
    .trim();

  if (stripped.length === 0) {
    return 'Unknown merchant';
  }

  return titleCase(stripped);
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => {
      const first = word[0];
      if (!first) {
        return word;
      }
      return first.toUpperCase() + word.slice(1);
    })
    .join(' ');
}
