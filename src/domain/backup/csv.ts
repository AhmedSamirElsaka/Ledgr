/**
 * Hand-written CSV helpers for transaction export/import.
 */

export type CsvTransactionRow = {
  id: string;
  occurredAt: string;
  type: string;
  amountMinor: number;
  currency: string;
  baseAmountMinor: number;
  accountId: string;
  categoryId: string;
  merchant: string;
  note: string;
  source: string;
};

const HEADER = [
  'id',
  'occurred_at',
  'type',
  'amount_minor',
  'currency',
  'base_amount_minor',
  'account_id',
  'category_id',
  'merchant',
  'note',
  'source',
] as const;

/** Fields the user can map from CSV columns during import. */
export const CSV_MAPPABLE_FIELDS = [
  'occurredAt',
  'type',
  'amountMinor',
  'baseAmountMinor',
  'currency',
  'merchant',
  'note',
  'accountId',
  'categoryId',
  'id',
] as const;

export type CsvMappableField = (typeof CSV_MAPPABLE_FIELDS)[number];

/** Fields required before an import can proceed. */
export const CSV_REQUIRED_FIELDS: readonly CsvMappableField[] = [
  'occurredAt',
  'amountMinor',
] as const;

export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function transactionsToCsv(rows: readonly CsvTransactionRow[]): string {
  const lines = [HEADER.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.occurredAt,
        row.type,
        String(row.amountMinor),
        row.currency,
        String(row.baseAmountMinor),
        row.accountId,
        row.categoryId,
        row.merchant,
        row.note,
        row.source,
      ]
        .map(escapeCsvCell)
        .join(','),
    );
  }
  return lines.join('\n');
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cell = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    if (ch === '\r') {
      continue;
    }
    cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter(r => r.some(c => c.trim().length > 0));
}

export type CsvColumnMapping = {
  occurredAt?: number;
  type?: number;
  amountMinor?: number;
  baseAmountMinor?: number;
  currency?: number;
  merchant?: number;
  note?: number;
  accountId?: number;
  categoryId?: number;
  id?: number;
};

export type MappedCsvRow = {
  id: string | null;
  occurredAt: string;
  type: string;
  amountMinor: number;
  baseAmountMinor: number | null;
  currency: string;
  merchant: string | null;
  note: string | null;
  accountId: string | null;
  categoryId: string | null;
};

export type CsvMappingValidation =
  | {ok: true}
  | {ok: false; missing: CsvMappableField[]};

export type CsvInspection = {
  headers: string[];
  headerRow: string[];
  dataRowCount: number;
  sampleRows: string[][];
  guessedMapping: CsvColumnMapping;
};

function parseAmountMinor(raw: string | undefined): number {
  if (raw == null || raw.trim() === '') {
    return 0;
  }
  const trimmed = raw.trim();
  // Integer minor units (export format and preferred import).
  if (/^-?\d+$/.test(trimmed)) {
    return Math.abs(Number(trimmed));
  }
  // Reject non-integer majors silently as 0 so the row is skipped rather than
  // mis-scaled — callers treat 0 as empty/skip.
  const asNumber = Number(trimmed);
  if (!Number.isFinite(asNumber)) {
    return 0;
  }
  // Whole numbers only; fractional majors are ambiguous without currency exponent.
  if (!Number.isInteger(asNumber)) {
    return 0;
  }
  return Math.abs(asNumber);
}

function parseOptionalMinor(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === '') {
    return null;
  }
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return null;
  }
  return Math.abs(value);
}

export function mapCsvRows(
  rows: string[][],
  mapping: CsvColumnMapping,
  hasHeader = true,
): MappedCsvRow[] {
  const data = hasHeader ? rows.slice(1) : rows;
  return data.map(cols => {
    const amountRaw =
      mapping.amountMinor !== undefined ? cols[mapping.amountMinor] : undefined;
    const baseRaw =
      mapping.baseAmountMinor !== undefined
        ? cols[mapping.baseAmountMinor]
        : undefined;
    return {
      id: mapping.id !== undefined ? cols[mapping.id]?.trim() || null : null,
      occurredAt:
        mapping.occurredAt !== undefined
          ? cols[mapping.occurredAt]?.trim() || new Date().toISOString()
          : new Date().toISOString(),
      type: mapping.type !== undefined ? cols[mapping.type]?.trim() || 'expense' : 'expense',
      amountMinor: parseAmountMinor(amountRaw),
      baseAmountMinor: parseOptionalMinor(baseRaw),
      currency:
        mapping.currency !== undefined
          ? cols[mapping.currency]?.trim().toUpperCase() || ''
          : '',
      merchant: mapping.merchant !== undefined ? cols[mapping.merchant]?.trim() || null : null,
      note: mapping.note !== undefined ? cols[mapping.note]?.trim() || null : null,
      accountId: mapping.accountId !== undefined ? cols[mapping.accountId]?.trim() || null : null,
      categoryId:
        mapping.categoryId !== undefined ? cols[mapping.categoryId]?.trim() || null : null,
    };
  });
}

export function guessCsvMapping(header: string[]): CsvColumnMapping {
  const lower = header.map(h => h.trim().toLowerCase());
  const find = (...names: string[]) => {
    for (const name of names) {
      const idx = lower.indexOf(name);
      if (idx >= 0) {
        return idx;
      }
    }
    return undefined;
  };
  return {
    occurredAt: find('occurred_at', 'date', 'datetime'),
    type: find('type'),
    amountMinor: find('amount_minor', 'amount'),
    baseAmountMinor: find('base_amount_minor', 'base_amount'),
    currency: find('currency'),
    merchant: find('merchant'),
    note: find('note', 'description'),
    accountId: find('account_id', 'account'),
    categoryId: find('category_id', 'category'),
    id: find('id'),
  };
}

export function validateCsvMapping(mapping: CsvColumnMapping): CsvMappingValidation {
  const missing = CSV_REQUIRED_FIELDS.filter(field => mapping[field] === undefined);
  if (missing.length > 0) {
    return {ok: false, missing: [...missing]};
  }
  return {ok: true};
}

/** Inspect pasted CSV for preview / mapping UI (does not mutate data). */
export function inspectCsv(text: string, sampleLimit = 5): CsvInspection {
  const rows = parseCsv(text);
  const headerRow = rows[0] ?? [];
  const headers = headerRow.map(h => h.trim());
  const dataRows = rows.slice(1);
  return {
    headers,
    headerRow,
    dataRowCount: dataRows.length,
    sampleRows: dataRows.slice(0, Math.max(0, sampleLimit)),
    guessedMapping: guessCsvMapping(headers),
  };
}

/**
 * Stable fingerprint for import duplicate detection.
 * Intentionally excludes note/category so re-imports of the same spend match.
 */
export function csvImportFingerprint(input: {
  occurredAt: string;
  type: string;
  amountMinor: number;
  currency: string;
  accountId: string;
  merchant: string | null;
}): string {
  const merchant = (input.merchant ?? '').trim().toLowerCase();
  return [
    input.occurredAt.trim(),
    input.type.trim().toLowerCase(),
    String(input.amountMinor),
    input.currency.trim().toUpperCase(),
    input.accountId.trim(),
    merchant,
  ].join('|');
}

export function setMappingField(
  mapping: CsvColumnMapping,
  field: CsvMappableField,
  columnIndex: number | undefined,
): CsvColumnMapping {
  const next: CsvColumnMapping = {...mapping};
  if (columnIndex === undefined) {
    delete next[field];
  } else {
    next[field] = columnIndex;
  }
  return next;
}
