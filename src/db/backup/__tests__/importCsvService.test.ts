import {MissingFxRateError} from '../../repositories/fxRatesRepository';
import {
  CsvImportError,
  importTransactionsCsv,
  previewCsvImport,
  type CsvImportRepos,
} from '../importCsvService';

import type {AccountRow} from '../../repositories/accountsRepository';
import type {
  CreateTransactionInput,
  TransactionRow,
} from '../../repositories/transactionsRepository';

const account: AccountRow = {
  id: 'account-1',
  name: 'Wallet',
  type: 'wallet',
  currency: 'EGP',
  opening_balance_minor: 0,
  color: 'blue',
  icon: 'wallet',
  archived: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function transactionFromInput(input: CreateTransactionInput): TransactionRow {
  return {
    id: 'transaction-1',
    account_id: input.accountId,
    category_id: input.categoryId ?? null,
    amount_minor: input.amountMinor,
    currency: input.currency,
    fx_rate_to_base: input.fxRateToBase,
    base_amount_minor: input.baseAmountMinor,
    type: input.type,
    transfer_pair_id: null,
    note: input.note ?? null,
    merchant: input.merchant ?? null,
    receipt_path: input.receiptPath ?? null,
    occurred_at: input.occurredAt ?? '2026-01-01T00:00:00.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    source: input.source ?? 'manual',
    source_ref: input.sourceRef ?? null,
    deleted_at: null,
    auto_categorized: input.autoCategorized ? 1 : 0,
  };
}

function createRepos(rate: number | null): {
  repos: CsvImportRepos;
  createMany: jest.Mock<Promise<TransactionRow[]>, [readonly CreateTransactionInput[]]>;
  getRate: jest.Mock<Promise<number | null>, [string, string]>;
  findBySourceRef: jest.Mock<Promise<TransactionRow | null>, [string]>;
  findActiveImportMatch: jest.Mock<Promise<TransactionRow | null>, [unknown]>;
  getById: jest.Mock<Promise<TransactionRow | null>, [string]>;
} {
  const createMany = jest.fn(
    async (inputs: readonly CreateTransactionInput[]): Promise<TransactionRow[]> =>
      inputs.map(transactionFromInput),
  );
  const getRate = jest.fn(
    async (base: string, quote: string): Promise<number | null> =>
      base === 'EGP' && quote === 'USD' ? rate : null,
  );
  const findBySourceRef = jest.fn(
    async (_sourceRef: string): Promise<TransactionRow | null> => null,
  );
  const findActiveImportMatch = jest.fn(
    async (_input: unknown): Promise<TransactionRow | null> => null,
  );
  const getById = jest.fn(async (_id: string): Promise<TransactionRow | null> => null);
  return {
    repos: {
      accounts: {listActive: async () => [account]},
      settings: {get: async () => 'EGP'},
      fxRates: {getRate},
      transactions: {createMany, findBySourceRef, findActiveImportMatch, getById},
    },
    createMany,
    getRate,
    findBySourceRef,
    findActiveImportMatch,
    getById,
  };
}

describe('importTransactionsCsv', () => {
  it('converts foreign quote amounts with the configured base/quote rate', async () => {
    const {repos, createMany, getRate} = createRepos(48.5);
    const csv =
      'occurred_at,type,amount_minor,currency,account_id\n' +
      '2026-01-02T00:00:00.000Z,expense,100,USD,';

    await expect(importTransactionsCsv(repos, csv)).resolves.toEqual({
      imported: 1,
      skippedEmpty: 0,
      skippedDuplicates: 0,
      readyCount: 1,
    });
    expect(getRate).toHaveBeenCalledWith('EGP', 'USD');
    expect(createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        amountMinor: 100,
        currency: 'USD',
        fxRateToBase: 48.5,
        baseAmountMinor: 4850,
        type: 'expense',
      }),
    ]);
  });

  it('preserves an exported historical base amount and derives its rate', async () => {
    const {repos, createMany, getRate} = createRepos(null);
    const csv =
      'occurred_at,type,amount_minor,currency,base_amount_minor\n' +
      '2026-01-02T00:00:00.000Z,income,300,USD,14500';

    await importTransactionsCsv(repos, csv);

    expect(getRate).not.toHaveBeenCalled();
    expect(createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        fxRateToBase: 14500 / 300,
        baseAmountMinor: 14500,
      }),
    ]);
  });

  it('fails before writing when a foreign row has no FX rate', async () => {
    const {repos, createMany} = createRepos(null);
    const csv =
      'occurred_at,type,amount_minor,currency\n' + '2026-01-02T00:00:00.000Z,expense,100,USD';

    await expect(importTransactionsCsv(repos, csv)).rejects.toBeInstanceOf(MissingFxRateError);
    await expect(importTransactionsCsv(repos, csv)).rejects.toMatchObject({
      code: 'missing_fx_rate',
    });
    expect(createMany).not.toHaveBeenCalled();
  });

  it('rejects transfer rows without partially importing earlier rows', async () => {
    const {repos, createMany} = createRepos(48.5);
    const csv =
      'occurred_at,type,amount_minor,currency\n' +
      '2026-01-02T00:00:00.000Z,expense,100,EGP\n' +
      '2026-01-03T00:00:00.000Z,transfer,200,EGP';

    const promise = importTransactionsCsv(repos, csv);
    await expect(promise).rejects.toBeInstanceOf(CsvImportError);
    await expect(promise).rejects.toMatchObject({
      code: 'unsupported_transfer',
      rowNumber: 3,
    });
    expect(createMany).not.toHaveBeenCalled();
  });

  it('skips duplicate rows and reports them in the result', async () => {
    const {repos, createMany, findActiveImportMatch} = createRepos(1);
    findActiveImportMatch.mockResolvedValueOnce(transactionFromInput({
      accountId: 'account-1',
      amountMinor: 100,
      currency: 'EGP',
      fxRateToBase: 1,
      baseAmountMinor: 100,
      type: 'expense',
      occurredAt: '2026-01-02T00:00:00.000Z',
      merchant: 'Cafe',
    }));

    const csv =
      'occurred_at,type,amount_minor,currency,merchant\n' +
      '2026-01-02T00:00:00.000Z,expense,100,EGP,Cafe\n' +
      '2026-01-03T00:00:00.000Z,expense,200,EGP,Shop';

    await expect(importTransactionsCsv(repos, csv)).resolves.toEqual({
      imported: 1,
      skippedEmpty: 0,
      skippedDuplicates: 1,
      readyCount: 1,
    });
    expect(createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        amountMinor: 200,
        merchant: 'Shop',
      }),
    ]);
  });

  it('skips zero-amount rows as empty', async () => {
    const {repos, createMany} = createRepos(1);
    const csv =
      'occurred_at,type,amount_minor,currency\n' +
      '2026-01-02T00:00:00.000Z,expense,0,EGP\n' +
      '2026-01-03T00:00:00.000Z,expense,150,EGP';

    await expect(importTransactionsCsv(repos, csv)).resolves.toEqual({
      imported: 1,
      skippedEmpty: 1,
      skippedDuplicates: 0,
      readyCount: 1,
    });
    expect(createMany).toHaveBeenCalledTimes(1);
  });

  it('dedupes identical rows within the same CSV batch', async () => {
    const {repos, createMany} = createRepos(1);
    const csv =
      'occurred_at,type,amount_minor,currency,merchant\n' +
      '2026-01-02T00:00:00.000Z,expense,100,EGP,Cafe\n' +
      '2026-01-02T00:00:00.000Z,expense,100,EGP,Cafe';

    await expect(importTransactionsCsv(repos, csv)).resolves.toEqual({
      imported: 1,
      skippedEmpty: 0,
      skippedDuplicates: 1,
      readyCount: 1,
    });
    expect(createMany).toHaveBeenCalledWith([
      expect.objectContaining({amountMinor: 100, merchant: 'Cafe'}),
    ]);
  });
});

describe('previewCsvImport', () => {
  it('returns ready counts without writing', async () => {
    const {repos, createMany} = createRepos(1);
    const csv =
      'occurred_at,type,amount_minor,currency\n' + '2026-01-02T00:00:00.000Z,expense,100,EGP';

    const preview = await previewCsvImport(repos, csv);
    expect(preview.readyCount).toBe(1);
    expect(preview.sample).toHaveLength(1);
    expect(preview.sample[0]?.status).toBe('ready');
    expect(createMany).not.toHaveBeenCalled();
  });

  it('accepts an explicit column mapping override', async () => {
    const {repos, createMany} = createRepos(1);
    const csv = 'when,kind,cents,ccy\n2026-01-02T00:00:00.000Z,expense,250,EGP';
    const preview = await previewCsvImport(repos, csv, {
      mapping: {occurredAt: 0, type: 1, amountMinor: 2, currency: 3},
    });
    expect(preview.readyCount).toBe(1);
    expect(preview.sample[0]?.amountMinor).toBe(250);
    expect(createMany).not.toHaveBeenCalled();
  });
});
