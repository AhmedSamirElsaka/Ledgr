import {
  csvImportFingerprint,
  guessCsvMapping,
  mapCsvRows,
  parseCsv,
  validateCsvMapping,
  type CsvColumnMapping,
  type MappedCsvRow,
} from '../../domain/backup/csv';
import {isCurrencyCode, type CurrencyCode} from '../../domain/money/Money';
import {
  MissingFxRateError,
  resolveFxRateToBase,
  type FxRatesRepository,
} from '../repositories/fxRatesRepository';

import type {AccountsRepository} from '../repositories/accountsRepository';
import type {SettingsRepository} from '../repositories/settingsRepository';
import type {
  CreateTransactionInput,
  TransactionsRepository,
  TransactionType,
} from '../repositories/transactionsRepository';

export type CsvImportErrorCode =
  | 'invalid_base_currency'
  | 'missing_account'
  | 'unsupported_currency'
  | 'unsupported_transfer'
  | 'invalid_mapping'
  | 'empty_csv';

export class CsvImportError extends Error {
  constructor(
    readonly code: CsvImportErrorCode,
    message: string,
    readonly rowNumber?: number,
  ) {
    super(message);
    this.name = 'CsvImportError';
  }
}

export type CsvImportRepos = {
  accounts: Pick<AccountsRepository, 'listActive'>;
  settings: Pick<SettingsRepository, 'get'>;
  fxRates: Pick<FxRatesRepository, 'getRate'>;
  transactions: Pick<
    TransactionsRepository,
    'createMany' | 'findBySourceRef' | 'findActiveImportMatch' | 'getById'
  >;
};

export type CsvImportOptions = {
  mapping?: CsvColumnMapping;
  hasHeader?: boolean;
  /** When true (default), matching existing rows are skipped instead of inserted. */
  skipDuplicates?: boolean;
};

export type CsvImportResult = {
  imported: number;
  skippedEmpty: number;
  skippedDuplicates: number;
  readyCount: number;
};

export type CsvImportPreviewRow = {
  rowNumber: number;
  occurredAt: string;
  type: TransactionType;
  amountMinor: number;
  currency: CurrencyCode;
  merchant: string | null;
  status: 'ready' | 'empty' | 'duplicate' | 'error';
  errorCode?: CsvImportErrorCode | 'missing_fx_rate';
  errorMessage?: string;
};

export type CsvImportPreview = CsvImportResult & {
  mapping: CsvColumnMapping;
  headers: string[];
  dataRowCount: number;
  sample: CsvImportPreviewRow[];
};

type PreparedCsvTransaction = CreateTransactionInput & {
  rowNumber: number;
  fingerprint: string;
};

function normalizeType(value: string, rowNumber: number): TransactionType {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'transfer') {
    throw new CsvImportError(
      'unsupported_transfer',
      `CSV row ${rowNumber} is a transfer. Transfer import is not supported yet.`,
      rowNumber,
    );
  }
  return normalized === 'income' ? 'income' : 'expense';
}

function normalizeCurrency(
  value: string,
  baseCurrency: CurrencyCode,
  rowNumber: number,
): CurrencyCode {
  const raw = value.trim();
  const normalized = (raw || baseCurrency).toUpperCase();
  if (!isCurrencyCode(normalized)) {
    throw new CsvImportError(
      'unsupported_currency',
      `CSV row ${rowNumber} uses unsupported currency "${value || '(blank)'}".`,
      rowNumber,
    );
  }
  return normalized;
}

function sourceRefForFingerprint(fingerprint: string): string {
  return `csv-import:${fingerprint}`;
}

async function resolveBaseAmount(
  repos: Pick<CsvImportRepos, 'fxRates'>,
  amountMinor: number,
  currency: CurrencyCode,
  baseCurrency: CurrencyCode,
  exportedBaseAmountMinor: number | null,
): Promise<{fxRateToBase: number; baseAmountMinor: number}> {
  if (currency === baseCurrency) {
    return {fxRateToBase: 1, baseAmountMinor: amountMinor};
  }

  if (exportedBaseAmountMinor != null && exportedBaseAmountMinor > 0) {
    return {
      fxRateToBase: exportedBaseAmountMinor / amountMinor,
      baseAmountMinor: exportedBaseAmountMinor,
    };
  }

  const fxRateToBase = await resolveFxRateToBase(repos.fxRates, currency, baseCurrency);
  return {
    fxRateToBase,
    baseAmountMinor: Math.round(amountMinor * fxRateToBase),
  };
}

async function isDuplicate(
  repos: Pick<CsvImportRepos, 'transactions'>,
  row: MappedCsvRow,
  prepared: Omit<PreparedCsvTransaction, 'rowNumber'>,
  batchFingerprints: Set<string>,
): Promise<boolean> {
  if (batchFingerprints.has(prepared.fingerprint)) {
    return true;
  }

  if (row.id) {
    const byId = await repos.transactions.getById(row.id);
    if (byId && byId.deleted_at == null) {
      return true;
    }
  }

  const bySourceRef = await repos.transactions.findBySourceRef(
    sourceRefForFingerprint(prepared.fingerprint),
  );
  if (bySourceRef) {
    return true;
  }

  const byMatch = await repos.transactions.findActiveImportMatch({
    accountId: prepared.accountId,
    amountMinor: prepared.amountMinor,
    currency: prepared.currency,
    type: prepared.type,
    occurredAt: prepared.occurredAt ?? '',
    merchant: prepared.merchant ?? null,
  });
  return byMatch != null;
}

async function prepareRow(
  repos: Pick<CsvImportRepos, 'fxRates' | 'transactions'>,
  row: MappedCsvRow,
  rowNumber: number,
  baseCurrency: CurrencyCode,
  fallbackAccountId: string,
  batchFingerprints: Set<string>,
  skipDuplicates: boolean,
): Promise<
  | {kind: 'ready'; transaction: PreparedCsvTransaction}
  | {kind: 'empty'}
  | {kind: 'duplicate'}
> {
  if (!row.amountMinor) {
    return {kind: 'empty'};
  }

  const type = normalizeType(row.type, rowNumber);
  const amountMinor = Math.abs(row.amountMinor);
  const currency = normalizeCurrency(row.currency, baseCurrency, rowNumber);
  const accountId = row.accountId || fallbackAccountId;
  const {fxRateToBase, baseAmountMinor} = await resolveBaseAmount(
    repos,
    amountMinor,
    currency,
    baseCurrency,
    row.baseAmountMinor,
  );

  const fingerprint = csvImportFingerprint({
    occurredAt: row.occurredAt,
    type,
    amountMinor,
    currency,
    accountId,
    merchant: row.merchant,
  });

  const prepared: PreparedCsvTransaction = {
    rowNumber,
    fingerprint,
    accountId,
    categoryId: row.categoryId,
    amountMinor,
    currency,
    fxRateToBase,
    baseAmountMinor,
    type,
    merchant: row.merchant,
    note: row.note,
    occurredAt: row.occurredAt,
    source: 'import',
    sourceRef: sourceRefForFingerprint(fingerprint),
  };

  if (skipDuplicates && (await isDuplicate(repos, row, prepared, batchFingerprints))) {
    return {kind: 'duplicate'};
  }

  batchFingerprints.add(fingerprint);
  return {kind: 'ready', transaction: prepared};
}

async function loadImportContext(repos: CsvImportRepos): Promise<{
  baseCurrency: CurrencyCode;
  fallbackAccountId: string;
}> {
  const configuredBase = (await repos.settings.get('base_currency')) ?? 'EGP';
  if (!isCurrencyCode(configuredBase)) {
    throw new CsvImportError(
      'invalid_base_currency',
      `Configured base currency "${configuredBase}" is unsupported.`,
    );
  }

  const accounts = await repos.accounts.listActive();
  const fallbackAccountId = accounts[0]?.id;
  if (!fallbackAccountId) {
    throw new CsvImportError(
      'missing_account',
      'Create an account before importing CSV transactions.',
    );
  }

  return {baseCurrency: configuredBase, fallbackAccountId};
}

function resolveMapping(
  headerRow: string[],
  options: CsvImportOptions | undefined,
  hasHeader: boolean,
): CsvColumnMapping {
  if (!hasHeader && options?.mapping == null) {
    throw new CsvImportError(
      'invalid_mapping',
      'CSV mapping is required when the file has no header row.',
    );
  }
  const mapping = options?.mapping ?? guessCsvMapping(headerRow);
  const validation = validateCsvMapping(mapping);
  if (!validation.ok) {
    throw new CsvImportError(
      'invalid_mapping',
      `CSV mapping is missing required columns: ${validation.missing.join(', ')}.`,
    );
  }
  return mapping;
}

async function prepareCsvBatch(
  repos: Pick<CsvImportRepos, 'fxRates' | 'transactions'>,
  text: string,
  baseCurrency: CurrencyCode,
  fallbackAccountId: string,
  options?: CsvImportOptions,
): Promise<{
  mapping: CsvColumnMapping;
  headers: string[];
  dataRowCount: number;
  ready: PreparedCsvTransaction[];
  skippedEmpty: number;
  skippedDuplicates: number;
}> {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    throw new CsvImportError('empty_csv', 'CSV is empty.');
  }

  const hasHeader = options?.hasHeader ?? true;
  const headerRow = hasHeader ? rows[0] ?? [] : [];
  const mapping = resolveMapping(headerRow, options, hasHeader);
  const mapped = mapCsvRows(rows, mapping, hasHeader);
  const skipDuplicates = options?.skipDuplicates ?? true;
  const ready: PreparedCsvTransaction[] = [];
  const batchFingerprints = new Set<string>();
  let skippedEmpty = 0;
  let skippedDuplicates = 0;

  for (const [index, row] of mapped.entries()) {
    const rowNumber = hasHeader ? index + 2 : index + 1;
    const result = await prepareRow(
      repos,
      row,
      rowNumber,
      baseCurrency,
      fallbackAccountId,
      batchFingerprints,
      skipDuplicates,
    );
    if (result.kind === 'empty') {
      skippedEmpty += 1;
      continue;
    }
    if (result.kind === 'duplicate') {
      skippedDuplicates += 1;
      continue;
    }
    ready.push(result.transaction);
  }

  return {
    mapping,
    headers: headerRow.map(h => h.trim()),
    dataRowCount: mapped.length,
    ready,
    skippedEmpty,
    skippedDuplicates,
  };
}

/**
 * Dry-run import: maps rows, resolves FX, detects duplicates — no writes.
 */
export async function previewCsvImport(
  repos: CsvImportRepos,
  text: string,
  options?: CsvImportOptions,
): Promise<CsvImportPreview> {
  const {baseCurrency, fallbackAccountId} = await loadImportContext(repos);
  const prepared = await prepareCsvBatch(
    repos,
    text,
    baseCurrency,
    fallbackAccountId,
    options,
  );

  const sample: CsvImportPreviewRow[] = prepared.ready.slice(0, 5).map(tx => ({
    rowNumber: tx.rowNumber,
    occurredAt: tx.occurredAt ?? '',
    type: tx.type,
    amountMinor: tx.amountMinor,
    currency: tx.currency as CurrencyCode,
    merchant: tx.merchant ?? null,
    status: 'ready',
  }));

  // Surface empty/duplicate counts in sample when there are no ready rows.
  if (sample.length === 0 && prepared.dataRowCount > 0) {
    const rows = parseCsv(text);
    const hasHeader = options?.hasHeader ?? true;
    const mapped = mapCsvRows(rows, prepared.mapping, hasHeader);
    for (const [index, row] of mapped.slice(0, 5).entries()) {
      const rowNumber = hasHeader ? index + 2 : index + 1;
      sample.push({
        rowNumber,
        occurredAt: row.occurredAt,
        type: row.type.trim().toLowerCase() === 'income' ? 'income' : 'expense',
        amountMinor: row.amountMinor,
        currency: (row.currency || baseCurrency) as CurrencyCode,
        merchant: row.merchant,
        status: row.amountMinor ? 'duplicate' : 'empty',
      });
    }
  }

  return {
    mapping: prepared.mapping,
    headers: prepared.headers,
    dataRowCount: prepared.dataRowCount,
    imported: 0,
    skippedEmpty: prepared.skippedEmpty,
    skippedDuplicates: prepared.skippedDuplicates,
    readyCount: prepared.ready.length,
    sample,
  };
}

export async function prepareCsvTransactions(
  repos: Pick<CsvImportRepos, 'fxRates' | 'transactions'>,
  text: string,
  baseCurrency: CurrencyCode,
  fallbackAccountId: string,
  options?: CsvImportOptions,
): Promise<{
  transactions: CreateTransactionInput[];
  skipped: number;
  skippedEmpty: number;
  skippedDuplicates: number;
}> {
  const prepared = await prepareCsvBatch(
    repos,
    text,
    baseCurrency,
    fallbackAccountId,
    options,
  );
  return {
    transactions: prepared.ready.map(
      ({rowNumber: _rowNumber, fingerprint: _fingerprint, ...input}) => input,
    ),
    skipped: prepared.skippedEmpty + prepared.skippedDuplicates,
    skippedEmpty: prepared.skippedEmpty,
    skippedDuplicates: prepared.skippedDuplicates,
  };
}

export async function importTransactionsCsv(
  repos: CsvImportRepos,
  text: string,
  options?: CsvImportOptions,
): Promise<CsvImportResult> {
  const {baseCurrency, fallbackAccountId} = await loadImportContext(repos);

  // Prepare the entire file before writing so unsupported transfers or FX errors
  // cannot leave a partially imported batch.
  const prepared = await prepareCsvBatch(
    repos,
    text,
    baseCurrency,
    fallbackAccountId,
    options,
  );

  const inputs: CreateTransactionInput[] = prepared.ready.map(
    ({rowNumber: _rowNumber, fingerprint: _fingerprint, ...input}) => input,
  );

  if (inputs.length > 0) {
    await repos.transactions.createMany(inputs);
  }

  return {
    imported: inputs.length,
    skippedEmpty: prepared.skippedEmpty,
    skippedDuplicates: prepared.skippedDuplicates,
    readyCount: inputs.length,
  };
}

export {MissingFxRateError};
