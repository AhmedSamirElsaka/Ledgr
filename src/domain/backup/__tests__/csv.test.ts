import {
  csvImportFingerprint,
  guessCsvMapping,
  inspectCsv,
  mapCsvRows,
  parseCsv,
  setMappingField,
  transactionsToCsv,
  validateCsvMapping,
} from '../csv';
import {validateBackupJson} from '../schema';

describe('csv helpers', () => {
  it('round-trips a simple row', () => {
    const csv = transactionsToCsv([
      {
        id: '1',
        occurredAt: '2026-01-01T00:00:00.000Z',
        type: 'expense',
        amountMinor: 100,
        currency: 'EGP',
        baseAmountMinor: 100,
        accountId: 'a',
        categoryId: 'c',
        merchant: 'Cafe, Nile',
        note: 'hello "world"',
        source: 'manual',
      },
    ]);
    const rows = parseCsv(csv);
    expect(rows[0]?.[0]).toBe('id');
    expect(rows[1]?.[8]).toBe('Cafe, Nile');
  });

  it('guesses column mapping including id', () => {
    const mapping = guessCsvMapping(['date', 'amount', 'currency', 'merchant', 'id']);
    expect(mapping.occurredAt).toBe(0);
    expect(mapping.amountMinor).toBe(1);
    expect(mapping.id).toBe(4);
  });

  it('validates required mapping fields', () => {
    expect(validateCsvMapping({}).ok).toBe(false);
    expect(validateCsvMapping({occurredAt: 0, amountMinor: 1}).ok).toBe(true);
  });

  it('inspects CSV for preview UI', () => {
    const csv = 'date,amount,currency\n2026-01-01,100,EGP\n2026-01-02,200,USD';
    const inspection = inspectCsv(csv, 1);
    expect(inspection.dataRowCount).toBe(2);
    expect(inspection.sampleRows).toHaveLength(1);
    expect(inspection.guessedMapping.occurredAt).toBe(0);
    expect(inspection.guessedMapping.amountMinor).toBe(1);
  });

  it('maps rows with integer minor units and rejects fractional amounts', () => {
    const rows = [
      ['date', 'amount', 'currency'],
      ['2026-01-01', '150', 'EGP'],
      ['2026-01-02', '12.50', 'USD'],
    ];
    const mapped = mapCsvRows(rows, {occurredAt: 0, amountMinor: 1, currency: 2});
    expect(mapped[0]?.amountMinor).toBe(150);
    expect(mapped[0]?.currency).toBe('EGP');
    expect(mapped[1]?.amountMinor).toBe(0);
  });

  it('builds a stable import fingerprint', () => {
    const a = csvImportFingerprint({
      occurredAt: '2026-01-01T00:00:00.000Z',
      type: 'expense',
      amountMinor: 100,
      currency: 'egp',
      accountId: 'a1',
      merchant: ' Cafe ',
    });
    const b = csvImportFingerprint({
      occurredAt: '2026-01-01T00:00:00.000Z',
      type: 'Expense',
      amountMinor: 100,
      currency: 'EGP',
      accountId: 'a1',
      merchant: 'cafe',
    });
    expect(a).toBe(b);
  });

  it('updates a single mapping field', () => {
    const mapping = setMappingField({occurredAt: 0}, 'amountMinor', 2);
    expect(mapping).toEqual({occurredAt: 0, amountMinor: 2});
    expect(setMappingField(mapping, 'amountMinor', undefined)).toEqual({occurredAt: 0});
  });
});

describe('backup schema', () => {
  it('rejects invalid payloads without touching data', () => {
    const result = validateBackupJson({version: 2});
    expect(result.ok).toBe(false);
  });

  it('accepts minimal valid backup', () => {
    const result = validateBackupJson({
      version: 1,
      exportedAt: '2026-09-10T00:00:00.000Z',
      settings: [],
      accounts: [],
      categories: [],
      transactions: [],
      budgets: [],
      subscriptions: [],
      sms_rules: [],
      sms_messages: [],
      fx_rates: [],
      merchant_aliases: [],
    });
    expect(result.ok).toBe(true);
  });
});
