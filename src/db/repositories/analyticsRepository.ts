import {subscribeDbChanges} from '../events';

import {Repository} from './Repository';

import type {SqlDatabase} from '../types';

export type SpendPoint = {period: string; totalMinor: number};
export type CategorySlice = {
  categoryId: string | null;
  categoryName: string;
  totalMinor: number;
  color: string | null;
};
export type MerchantSlice = {merchant: string; totalMinor: number; count: number};
export type IncomeExpense = {incomeMinor: number; expenseMinor: number};
export type CashFlowPoint = {period: string; netMinor: number};
export type DowTodPoint = {bucket: string; totalMinor: number; count: number};
export type AmountStats = {
  avgMinor: number;
  medianMinor: number;
  count: number;
};
export type LargestTx = {
  id: string;
  merchant: string | null;
  note: string | null;
  baseAmountMinor: number;
  occurredAt: string;
  type: string;
};
export type RecurringSplitMethod = 'source' | 'merchant_heuristic' | 'empty';
export type RecurringApprox = {
  recurringMinor: number;
  oneOffMinor: number;
  method: RecurringSplitMethod;
};
export type StreakStats = {current: number; longest: number; activeDays: number};

export type BalanceHistoryPoint = {period: string; balanceMinor: number};
export type AccountBalanceSeed = {
  accountId: string;
  accountName: string;
  currency: string;
  color: string | null;
  /** Balance immediately before the range (opening + prior txs). */
  balanceBeforeRangeMinor: number;
};
export type AccountDailyDelta = {
  accountId: string;
  period: string;
  deltaMinor: number;
};
export type AccountBalanceHistory = {
  accountId: string;
  accountName: string;
  currency: string;
  color: string | null;
  points: BalanceHistoryPoint[];
};

export type BudgetAdherencePeriodKind = 'weekly' | 'monthly' | 'custom';
export type BudgetAdherencePoint = {
  period: string;
  budgetMinor: number;
  spentMinor: number;
  overBudget: boolean;
};
export type BudgetAdherenceSeries = {
  budgetId: string;
  categoryId: string | null;
  categoryName: string;
  periodKind: BudgetAdherencePeriodKind;
  points: BudgetAdherencePoint[];
};
export type BudgetSpendBucket = {
  categoryId: string | null;
  period: string;
  spentMinor: number;
};
export type BudgetAdherenceSeed = {
  budgetId: string;
  categoryId: string | null;
  categoryName: string;
  periodKind: BudgetAdherencePeriodKind;
  amountMinor: number;
  startDate: string;
  endDate: string | null;
};

type CacheEntry<T> = {key: string; value: T};

/**
 * SQL-only analytics aggregations with an in-memory cache invalidated on writes.
 */
export class AnalyticsRepository extends Repository {
  private spendCache: CacheEntry<SpendPoint[]> | null = null;
  private categoryCache: CacheEntry<CategorySlice[]> | null = null;
  private merchantCache: CacheEntry<MerchantSlice[]> | null = null;
  private incomeExpenseCache: CacheEntry<IncomeExpense> | null = null;
  private cashFlowCache: CacheEntry<CashFlowPoint[]> | null = null;
  private dowCache: CacheEntry<DowTodPoint[]> | null = null;
  private todCache: CacheEntry<DowTodPoint[]> | null = null;
  private statsCache: CacheEntry<AmountStats> | null = null;
  private largestCache: CacheEntry<LargestTx[]> | null = null;
  private recurringCache: CacheEntry<RecurringApprox> | null = null;
  private streakCache: CacheEntry<StreakStats> | null = null;
  private balanceCache: CacheEntry<AccountBalanceHistory[]> | null = null;
  private budgetAdherenceCache: CacheEntry<BudgetAdherenceSeries[]> | null = null;
  private unsub: (() => void) | null = null;

  constructor(db: SqlDatabase) {
    super(db);
    this.unsub = subscribeDbChanges(event => {
      if (
        event.table === 'transactions' ||
        event.table === 'budgets' ||
        event.table === 'categories' ||
        event.table === 'accounts'
      ) {
        this.invalidate();
      }
    });
  }

  dispose(): void {
    this.unsub?.();
    this.unsub = null;
  }

  invalidate(): void {
    this.spendCache = null;
    this.categoryCache = null;
    this.merchantCache = null;
    this.incomeExpenseCache = null;
    this.cashFlowCache = null;
    this.dowCache = null;
    this.todCache = null;
    this.statsCache = null;
    this.largestCache = null;
    this.recurringCache = null;
    this.streakCache = null;
    this.balanceCache = null;
    this.budgetAdherenceCache = null;
  }

  private periodKey(fromIso: string, toIso: string): string {
    return `${fromIso}|${toIso}`;
  }

  async spendOverTime(
    fromIso: string,
    toIso: string,
    granularity: 'day' | 'week' | 'month' = 'day',
  ): Promise<SpendPoint[]> {
    const key = `spend:${granularity}:${this.periodKey(fromIso, toIso)}`;
    if (this.spendCache?.key === key) {
      return this.spendCache.value;
    }
    const fmt =
      granularity === 'month'
        ? '%Y-%m'
        : granularity === 'week'
          ? '%Y-W%W'
          : '%Y-%m-%d';
    const result = await this.query(
      `SELECT strftime(?, occurred_at) AS period,
              COALESCE(SUM(ABS(base_amount_minor)), 0) AS total
       FROM transactions
       WHERE deleted_at IS NULL
         AND type = 'expense'
         AND occurred_at >= ? AND occurred_at <= ?
       GROUP BY period
       ORDER BY period ASC`,
      [fmt, fromIso, toIso],
    );
    const value = result.rows.map(row => ({
      period: String(row.period),
      totalMinor: Number(row.total),
    }));
    this.spendCache = {key, value};
    return value;
  }

  async categoryBreakdown(fromIso: string, toIso: string): Promise<CategorySlice[]> {
    const key = `cat:${this.periodKey(fromIso, toIso)}`;
    if (this.categoryCache?.key === key) {
      return this.categoryCache.value;
    }
    const result = await this.query(
      `SELECT t.category_id AS category_id,
              COALESCE(c.name, 'Uncategorized') AS category_name,
              c.color AS color,
              COALESCE(SUM(ABS(t.base_amount_minor)), 0) AS total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.deleted_at IS NULL
         AND t.type = 'expense'
         AND t.occurred_at >= ? AND t.occurred_at <= ?
       GROUP BY t.category_id
       ORDER BY total DESC`,
      [fromIso, toIso],
    );
    const value = result.rows.map(row => ({
      categoryId: row.category_id == null ? null : String(row.category_id),
      categoryName: String(row.category_name),
      totalMinor: Number(row.total),
      color: row.color == null ? null : String(row.color),
    }));
    this.categoryCache = {key, value};
    return value;
  }

  async topMerchants(fromIso: string, toIso: string, limit = 10): Promise<MerchantSlice[]> {
    const key = `merch:${limit}:${this.periodKey(fromIso, toIso)}`;
    if (this.merchantCache?.key === key) {
      return this.merchantCache.value;
    }
    const result = await this.query(
      `SELECT merchant,
              COALESCE(SUM(ABS(base_amount_minor)), 0) AS total,
              COUNT(*) AS cnt
       FROM transactions
       WHERE deleted_at IS NULL
         AND type = 'expense'
         AND merchant IS NOT NULL AND merchant != ''
         AND occurred_at >= ? AND occurred_at <= ?
       GROUP BY merchant
       ORDER BY total DESC
       LIMIT ?`,
      [fromIso, toIso, limit],
    );
    const value = result.rows.map(row => ({
      merchant: String(row.merchant),
      totalMinor: Number(row.total),
      count: Number(row.cnt),
    }));
    this.merchantCache = {key, value};
    return value;
  }

  async incomeVsExpense(fromIso: string, toIso: string): Promise<IncomeExpense> {
    const key = `ie:${this.periodKey(fromIso, toIso)}`;
    if (this.incomeExpenseCache?.key === key) {
      return this.incomeExpenseCache.value;
    }
    const result = await this.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN ABS(base_amount_minor) ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(base_amount_minor) ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE deleted_at IS NULL
         AND occurred_at >= ? AND occurred_at <= ?`,
      [fromIso, toIso],
    );
    const row = result.rows[0];
    const value = {
      incomeMinor: Number(row?.income ?? 0),
      expenseMinor: Number(row?.expense ?? 0),
    };
    this.incomeExpenseCache = {key, value};
    return value;
  }

  async cashFlow(fromIso: string, toIso: string): Promise<CashFlowPoint[]> {
    const key = `cf:${this.periodKey(fromIso, toIso)}`;
    if (this.cashFlowCache?.key === key) {
      return this.cashFlowCache.value;
    }
    const result = await this.query(
      `SELECT strftime('%Y-%m-%d', occurred_at) AS period,
              COALESCE(SUM(
                CASE
                  WHEN type = 'income' THEN ABS(base_amount_minor)
                  WHEN type = 'expense' THEN -ABS(base_amount_minor)
                  ELSE 0
                END
              ), 0) AS net
       FROM transactions
       WHERE deleted_at IS NULL
         AND occurred_at >= ? AND occurred_at <= ?
       GROUP BY period
       ORDER BY period ASC`,
      [fromIso, toIso],
    );
    const value = result.rows.map(row => ({
      period: String(row.period),
      netMinor: Number(row.net),
    }));
    this.cashFlowCache = {key, value};
    return value;
  }

  async dayOfWeekPattern(fromIso: string, toIso: string): Promise<DowTodPoint[]> {
    const key = `dow:${this.periodKey(fromIso, toIso)}`;
    if (this.dowCache?.key === key) {
      return this.dowCache.value;
    }
    const result = await this.query(
      `SELECT CAST(strftime('%w', occurred_at) AS INTEGER) AS bucket,
              COALESCE(SUM(ABS(base_amount_minor)), 0) AS total,
              COUNT(*) AS cnt
       FROM transactions
       WHERE deleted_at IS NULL
         AND type = 'expense'
         AND occurred_at >= ? AND occurred_at <= ?
       GROUP BY bucket
       ORDER BY bucket ASC`,
      [fromIso, toIso],
    );
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const value = result.rows.map(row => {
      const idx = Number(row.bucket);
      return {
        bucket: names[idx] ?? String(idx),
        totalMinor: Number(row.total),
        count: Number(row.cnt),
      };
    });
    this.dowCache = {key, value};
    return value;
  }

  async timeOfDayPattern(fromIso: string, toIso: string): Promise<DowTodPoint[]> {
    const key = `tod:${this.periodKey(fromIso, toIso)}`;
    if (this.todCache?.key === key) {
      return this.todCache.value;
    }
    const result = await this.query(
      `SELECT CAST(strftime('%H', occurred_at) AS INTEGER) AS bucket,
              COALESCE(SUM(ABS(base_amount_minor)), 0) AS total,
              COUNT(*) AS cnt
       FROM transactions
       WHERE deleted_at IS NULL
         AND type = 'expense'
         AND occurred_at >= ? AND occurred_at <= ?
       GROUP BY bucket
       ORDER BY bucket ASC`,
      [fromIso, toIso],
    );
    const value = result.rows.map(row => ({
      bucket: `${String(row.bucket).padStart(2, '0')}:00`,
      totalMinor: Number(row.total),
      count: Number(row.cnt),
    }));
    this.todCache = {key, value};
    return value;
  }

  async amountStats(fromIso: string, toIso: string): Promise<AmountStats> {
    const key = `stats:${this.periodKey(fromIso, toIso)}`;
    if (this.statsCache?.key === key) {
      return this.statsCache.value;
    }
    const avgResult = await this.query(
      `SELECT
         COALESCE(AVG(ABS(base_amount_minor)), 0) AS avg_minor,
         COUNT(*) AS cnt
       FROM transactions
       WHERE deleted_at IS NULL
         AND type = 'expense'
         AND occurred_at >= ? AND occurred_at <= ?`,
      [fromIso, toIso],
    );
    const count = Number(avgResult.rows[0]?.cnt ?? 0);
    const avgMinor = Math.round(Number(avgResult.rows[0]?.avg_minor ?? 0));

    // Median via ordered select + offset (SQL-side, not full JS scan of all columns)
    let medianMinor = 0;
    if (count > 0) {
      const offset = Math.floor((count - 1) / 2);
      const medResult = await this.query(
        `SELECT ABS(base_amount_minor) AS amt
         FROM transactions
         WHERE deleted_at IS NULL
           AND type = 'expense'
           AND occurred_at >= ? AND occurred_at <= ?
         ORDER BY ABS(base_amount_minor) ASC
         LIMIT 1 OFFSET ?`,
        [fromIso, toIso, offset],
      );
      medianMinor = Number(medResult.rows[0]?.amt ?? 0);
    }

    const value = {avgMinor, medianMinor, count};
    this.statsCache = {key, value};
    return value;
  }

  async largestTransactions(
    fromIso: string,
    toIso: string,
    limit = 5,
  ): Promise<LargestTx[]> {
    const key = `largest:${limit}:${this.periodKey(fromIso, toIso)}`;
    if (this.largestCache?.key === key) {
      return this.largestCache.value;
    }
    const result = await this.query(
      `SELECT id, merchant, note, base_amount_minor, occurred_at, type
       FROM transactions
       WHERE deleted_at IS NULL
         AND type IN ('expense', 'income')
         AND occurred_at >= ? AND occurred_at <= ?
       ORDER BY ABS(base_amount_minor) DESC
       LIMIT ?`,
      [fromIso, toIso, limit],
    );
    const value = result.rows.map(row => ({
      id: String(row.id),
      merchant: row.merchant == null ? null : String(row.merchant),
      note: row.note == null ? null : String(row.note),
      baseAmountMinor: Number(row.base_amount_minor),
      occurredAt: String(row.occurred_at),
      type: String(row.type),
    }));
    this.largestCache = {key, value};
    return value;
  }

  /**
   * Recurring vs one-off expenses.
   * Prefers `source = 'recurring'` / `source_ref` prefix when any such rows exist;
   * otherwise falls back to merchant frequency (≥3 expenses in period).
   */
  async recurringVsOneOff(fromIso: string, toIso: string): Promise<RecurringApprox> {
    const key = `rec:${this.periodKey(fromIso, toIso)}`;
    if (this.recurringCache?.key === key) {
      return this.recurringCache.value;
    }

    const sourceResult = await this.query(
      `SELECT
         COALESCE(SUM(CASE
           WHEN source = 'recurring'
             OR (source_ref IS NOT NULL AND source_ref LIKE 'recurring:%')
           THEN ABS(base_amount_minor) ELSE 0 END), 0) AS recurring,
         COALESCE(SUM(CASE
           WHEN NOT (
             source = 'recurring'
             OR (source_ref IS NOT NULL AND source_ref LIKE 'recurring:%')
           )
           THEN ABS(base_amount_minor) ELSE 0 END), 0) AS one_off,
         COALESCE(SUM(CASE
           WHEN source = 'recurring'
             OR (source_ref IS NOT NULL AND source_ref LIKE 'recurring:%')
           THEN 1 ELSE 0 END), 0) AS recurring_count,
         COUNT(*) AS expense_count
       FROM transactions
       WHERE deleted_at IS NULL
         AND type = 'expense'
         AND occurred_at >= ? AND occurred_at <= ?`,
      [fromIso, toIso],
    );

    const expenseCount = Number(sourceResult.rows[0]?.expense_count ?? 0);
    if (expenseCount === 0) {
      const empty: RecurringApprox = {
        recurringMinor: 0,
        oneOffMinor: 0,
        method: 'empty',
      };
      this.recurringCache = {key, value: empty};
      return empty;
    }

    const recurringCount = Number(sourceResult.rows[0]?.recurring_count ?? 0);
    if (recurringCount > 0) {
      const value: RecurringApprox = {
        recurringMinor: Number(sourceResult.rows[0]?.recurring ?? 0),
        oneOffMinor: Number(sourceResult.rows[0]?.one_off ?? 0),
        method: 'source',
      };
      this.recurringCache = {key, value};
      return value;
    }

    const heuristicResult = await this.query(
      `WITH merchant_counts AS (
         SELECT merchant, COUNT(*) AS cnt, SUM(ABS(base_amount_minor)) AS total
         FROM transactions
         WHERE deleted_at IS NULL
           AND type = 'expense'
           AND merchant IS NOT NULL AND merchant != ''
           AND occurred_at >= ? AND occurred_at <= ?
         GROUP BY merchant
       )
       SELECT
         COALESCE(SUM(CASE WHEN cnt >= 3 THEN total ELSE 0 END), 0) AS recurring,
         COALESCE(SUM(CASE WHEN cnt < 3 THEN total ELSE 0 END), 0) AS one_off
       FROM merchant_counts`,
      [fromIso, toIso],
    );

    const unnamedResult = await this.query(
      `SELECT COALESCE(SUM(ABS(base_amount_minor)), 0) AS total
       FROM transactions
       WHERE deleted_at IS NULL
         AND type = 'expense'
         AND (merchant IS NULL OR merchant = '')
         AND occurred_at >= ? AND occurred_at <= ?`,
      [fromIso, toIso],
    );

    const value: RecurringApprox = {
      recurringMinor: Number(heuristicResult.rows[0]?.recurring ?? 0),
      oneOffMinor:
        Number(heuristicResult.rows[0]?.one_off ?? 0) +
        Number(unnamedResult.rows[0]?.total ?? 0),
      method: 'merchant_heuristic',
    };
    this.recurringCache = {key, value};
    return value;
  }

  /**
   * Per-account running balance history in each account's own currency.
   * Includes a single opening point when the range has no activity (honest flat state).
   */
  async accountBalanceHistory(
    fromIso: string,
    toIso: string,
  ): Promise<AccountBalanceHistory[]> {
    const key = `bal:${this.periodKey(fromIso, toIso)}`;
    if (this.balanceCache?.key === key) {
      return this.balanceCache.value;
    }

    const fromDate = fromIso.slice(0, 10);
    const accountsResult = await this.query(
      `SELECT id, name, currency, color, opening_balance_minor
       FROM accounts
       WHERE archived = 0
       ORDER BY name ASC`,
    );

    if (accountsResult.rows.length === 0) {
      this.balanceCache = {key, value: []};
      return [];
    }

    const priorResult = await this.query(
      `SELECT account_id AS account_id,
              COALESCE(SUM(
                CASE type
                  WHEN 'income' THEN ABS(amount_minor)
                  WHEN 'expense' THEN -ABS(amount_minor)
                  WHEN 'transfer' THEN amount_minor
                  ELSE 0
                END
              ), 0) AS prior_delta
       FROM transactions
       WHERE deleted_at IS NULL
         AND occurred_at < ?
       GROUP BY account_id`,
      [fromIso],
    );
    const priorByAccount = new Map<string, number>();
    for (const row of priorResult.rows) {
      priorByAccount.set(String(row.account_id), Number(row.prior_delta));
    }

    const seeds: AccountBalanceSeed[] = accountsResult.rows.map(row => {
      const accountId = String(row.id);
      return {
        accountId,
        accountName: String(row.name),
        currency: String(row.currency),
        color: row.color == null ? null : String(row.color),
        balanceBeforeRangeMinor:
          Number(row.opening_balance_minor) + (priorByAccount.get(accountId) ?? 0),
      };
    });

    const deltaResult = await this.query(
      `SELECT account_id AS account_id,
              date(occurred_at) AS period,
              COALESCE(SUM(
                CASE type
                  WHEN 'income' THEN ABS(amount_minor)
                  WHEN 'expense' THEN -ABS(amount_minor)
                  WHEN 'transfer' THEN amount_minor
                  ELSE 0
                END
              ), 0) AS delta
       FROM transactions
       WHERE deleted_at IS NULL
         AND occurred_at >= ? AND occurred_at <= ?
       GROUP BY account_id, period
       ORDER BY period ASC`,
      [fromIso, toIso],
    );
    const deltas: AccountDailyDelta[] = deltaResult.rows.map(row => ({
      accountId: String(row.account_id),
      period: String(row.period),
      deltaMinor: Number(row.delta),
    }));

    const value = mapAccountBalanceHistory(seeds, deltas, fromDate);
    this.balanceCache = {key, value};
    return value;
  }

  /**
   * Spend vs budget envelope for each active budget across periods in range.
   */
  async budgetAdherenceHistory(
    fromIso: string,
    toIso: string,
  ): Promise<BudgetAdherenceSeries[]> {
    const key = `ba:${this.periodKey(fromIso, toIso)}`;
    if (this.budgetAdherenceCache?.key === key) {
      return this.budgetAdherenceCache.value;
    }

    const budgetsResult = await this.query(
      `SELECT b.id AS id,
              b.category_id AS category_id,
              COALESCE(c.name, '') AS category_name,
              b.period AS period_kind,
              b.amount_minor AS amount_minor,
              b.start_date AS start_date,
              b.end_date AS end_date
       FROM budgets b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.active = 1
       ORDER BY b.start_date DESC`,
    );

    if (budgetsResult.rows.length === 0) {
      this.budgetAdherenceCache = {key, value: []};
      return [];
    }

    const seeds: BudgetAdherenceSeed[] = budgetsResult.rows.map(row => {
      const periodKind = String(row.period_kind);
      const kind: BudgetAdherencePeriodKind =
        periodKind === 'weekly' || periodKind === 'custom' ? periodKind : 'monthly';
      const categoryId = row.category_id == null ? null : String(row.category_id);
      const rawName = String(row.category_name);
      return {
        budgetId: String(row.id),
        categoryId,
        categoryName: categoryId == null ? '' : rawName.length === 0 ? '' : rawName,
        periodKind: kind,
        amountMinor: Number(row.amount_minor),
        startDate: String(row.start_date).slice(0, 10),
        endDate: row.end_date == null ? null : String(row.end_date).slice(0, 10),
      };
    });

    const needsMonthly = seeds.some(s => s.periodKind === 'monthly');
    const needsWeekly = seeds.some(s => s.periodKind === 'weekly');
    const needsCustom = seeds.some(s => s.periodKind === 'custom');

    const buckets: BudgetSpendBucket[] = [];

    if (needsMonthly) {
      const monthly = await this.query(
        `SELECT category_id AS category_id,
                strftime('%Y-%m', occurred_at) AS period,
                COALESCE(SUM(ABS(base_amount_minor)), 0) AS spent
         FROM transactions
         WHERE deleted_at IS NULL
           AND type = 'expense'
           AND occurred_at >= ? AND occurred_at <= ?
         GROUP BY category_id, period`,
        [fromIso, toIso],
      );
      for (const row of monthly.rows) {
        buckets.push({
          categoryId: row.category_id == null ? null : String(row.category_id),
          period: String(row.period),
          spentMinor: Number(row.spent),
        });
      }
      const monthlyAll = await this.query(
        `SELECT strftime('%Y-%m', occurred_at) AS period,
                COALESCE(SUM(ABS(base_amount_minor)), 0) AS spent
         FROM transactions
         WHERE deleted_at IS NULL
           AND type = 'expense'
           AND occurred_at >= ? AND occurred_at <= ?
         GROUP BY period`,
        [fromIso, toIso],
      );
      for (const row of monthlyAll.rows) {
        buckets.push({
          categoryId: null,
          period: `all:${String(row.period)}`,
          spentMinor: Number(row.spent),
        });
      }
    }

    if (needsWeekly) {
      const weekly = await this.query(
        `SELECT category_id AS category_id,
                date(occurred_at, '-' || ((CAST(strftime('%w', occurred_at) AS INTEGER) + 6) % 7) || ' days') AS period,
                COALESCE(SUM(ABS(base_amount_minor)), 0) AS spent
         FROM transactions
         WHERE deleted_at IS NULL
           AND type = 'expense'
           AND occurred_at >= ? AND occurred_at <= ?
         GROUP BY category_id, period`,
        [fromIso, toIso],
      );
      for (const row of weekly.rows) {
        buckets.push({
          categoryId: row.category_id == null ? null : String(row.category_id),
          period: String(row.period),
          spentMinor: Number(row.spent),
        });
      }
      const weeklyAll = await this.query(
        `SELECT date(occurred_at, '-' || ((CAST(strftime('%w', occurred_at) AS INTEGER) + 6) % 7) || ' days') AS period,
                COALESCE(SUM(ABS(base_amount_minor)), 0) AS spent
         FROM transactions
         WHERE deleted_at IS NULL
           AND type = 'expense'
           AND occurred_at >= ? AND occurred_at <= ?
         GROUP BY period`,
        [fromIso, toIso],
      );
      for (const row of weeklyAll.rows) {
        buckets.push({
          categoryId: null,
          period: `all:${String(row.period)}`,
          spentMinor: Number(row.spent),
        });
      }
    }

    if (needsCustom) {
      for (const seed of seeds) {
        if (seed.periodKind !== 'custom') {
          continue;
        }
        const startIso = `${seed.startDate}T00:00:00.000Z`;
        const endIso = seed.endDate
          ? `${seed.endDate}T23:59:59.999Z`
          : toIso;
        const clampedFrom = startIso > fromIso ? startIso : fromIso;
        const clampedTo = endIso < toIso ? endIso : toIso;
        if (clampedFrom > clampedTo) {
          continue;
        }
        const customSpend = seed.categoryId
          ? await this.query(
              `SELECT COALESCE(SUM(ABS(base_amount_minor)), 0) AS spent
               FROM transactions
               WHERE deleted_at IS NULL
                 AND type = 'expense'
                 AND category_id = ?
                 AND occurred_at >= ? AND occurred_at <= ?`,
              [seed.categoryId, clampedFrom, clampedTo],
            )
          : await this.query(
              `SELECT COALESCE(SUM(ABS(base_amount_minor)), 0) AS spent
               FROM transactions
               WHERE deleted_at IS NULL
                 AND type = 'expense'
                 AND occurred_at >= ? AND occurred_at <= ?`,
              [clampedFrom, clampedTo],
            );
        buckets.push({
          categoryId: seed.categoryId,
          period: `custom:${seed.budgetId}`,
          spentMinor: Number(customSpend.rows[0]?.spent ?? 0),
        });
      }
    }

    const value = mapBudgetAdherenceHistory(seeds, buckets, fromIso.slice(0, 10), toIso.slice(0, 10));
    this.budgetAdherenceCache = {key, value};
    return value;
  }

  async streakStats(): Promise<StreakStats> {
    const key = 'streak';
    if (this.streakCache?.key === key) {
      return this.streakCache.value;
    }
    const result = await this.query(
      `SELECT DISTINCT date(occurred_at) AS d
       FROM transactions
       WHERE deleted_at IS NULL
       ORDER BY d DESC
       LIMIT 400`,
    );
    const days = result.rows.map(row => String(row.d));
    const value = mapStreakStats(days);
    this.streakCache = {key, value};
    return value;
  }
}

/** Pure mapper — unit-tested without SQLite. */
export function mapStreakStats(dayKeysDesc: readonly string[]): StreakStats {
  const daySet = new Set(dayKeysDesc);
  const activeDays = daySet.size;
  if (activeDays === 0) {
    return {current: 0, longest: 0, activeDays: 0};
  }

  const sorted = [...daySet].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (!prev || !curr) {
      continue;
    }
    const prevMs = Date.parse(`${prev}T00:00:00.000Z`);
    const currMs = Date.parse(`${curr}T00:00:00.000Z`);
    if (currMs - prevMs === 86400000) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak from most recent day
  const newest = sorted[sorted.length - 1];
  let current = 0;
  if (newest) {
    let cursor = Date.parse(`${newest}T00:00:00.000Z`);
    while (daySet.has(new Date(cursor).toISOString().slice(0, 10))) {
      current += 1;
      cursor -= 86400000;
    }
  }

  return {current, longest: Math.max(longest, current), activeDays};
}

/** Pure mapper — unit-tested without SQLite. */
export function mapAccountBalanceHistory(
  seeds: readonly AccountBalanceSeed[],
  deltas: readonly AccountDailyDelta[],
  fromDate: string,
): AccountBalanceHistory[] {
  const byAccount = new Map<string, AccountDailyDelta[]>();
  for (const delta of deltas) {
    const list = byAccount.get(delta.accountId) ?? [];
    list.push(delta);
    byAccount.set(delta.accountId, list);
  }

  return seeds.map(seed => {
    const accountDeltas = [...(byAccount.get(seed.accountId) ?? [])].sort((a, b) =>
      a.period.localeCompare(b.period),
    );

    if (accountDeltas.length === 0) {
      return {
        accountId: seed.accountId,
        accountName: seed.accountName,
        currency: seed.currency,
        color: seed.color,
        points: [{period: fromDate, balanceMinor: seed.balanceBeforeRangeMinor}],
      };
    }

    let running = seed.balanceBeforeRangeMinor;
    const points: BalanceHistoryPoint[] = [];
    const first = accountDeltas[0];
    if (first && first.period > fromDate) {
      points.push({period: fromDate, balanceMinor: running});
    }
    for (const delta of accountDeltas) {
      running += delta.deltaMinor;
      points.push({period: delta.period, balanceMinor: running});
    }

    return {
      accountId: seed.accountId,
      accountName: seed.accountName,
      currency: seed.currency,
      color: seed.color,
      points,
    };
  });
}

/** List YYYY-MM keys from fromDate..toDate inclusive (calendar months). */
export function listMonthKeys(fromDate: string, toDate: string): string[] {
  if (fromDate > toDate) {
    return [];
  }
  const keys: string[] = [];
  let year = Number(fromDate.slice(0, 4));
  let month = Number(fromDate.slice(5, 7));
  const endYear = Number(toDate.slice(0, 4));
  const endMonth = Number(toDate.slice(5, 7));
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}

/**
 * List Monday-start week keys (YYYY-MM-DD of Monday) covering fromDate..toDate.
 */
export function listWeekKeys(fromDate: string, toDate: string): string[] {
  if (fromDate > toDate) {
    return [];
  }
  const keys: string[] = [];
  const cursor = parseLocalDate(fromDate);
  const end = parseLocalDate(toDate);
  if (!cursor || !end) {
    return [];
  }
  // Move to Monday of the week containing fromDate (Mon=0 in this shift).
  const dow = cursor.getDay(); // 0=Sun
  const toMonday = dow === 0 ? -6 : 1 - dow;
  cursor.setDate(cursor.getDate() + toMonday);
  while (cursor <= end) {
    keys.push(formatLocalDate(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return keys;
}

function parseLocalDate(ymd: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Pure mapper — unit-tested without SQLite. */
export function mapBudgetAdherenceHistory(
  seeds: readonly BudgetAdherenceSeed[],
  buckets: readonly BudgetSpendBucket[],
  fromDate: string,
  toDate: string,
): BudgetAdherenceSeries[] {
  const spentLookup = new Map<string, number>();
  for (const bucket of buckets) {
    const catKey = bucket.categoryId ?? '__all__';
    spentLookup.set(`${catKey}|${bucket.period}`, bucket.spentMinor);
  }

  return seeds.map(seed => {
    const points: BudgetAdherencePoint[] = [];

    if (seed.periodKind === 'custom') {
      const period = `custom:${seed.budgetId}`;
      const lookupKey =
        seed.categoryId == null
          ? `__all__|${period}`
          : `${seed.categoryId}|${period}`;
      const spentMinor = spentLookup.get(lookupKey) ?? 0;
      const budgetStart = seed.startDate;
      const budgetEnd = seed.endDate ?? toDate;
      if (budgetStart <= toDate && budgetEnd >= fromDate) {
        points.push({
          period: `${budgetStart}→${budgetEnd}`,
          budgetMinor: seed.amountMinor,
          spentMinor,
          overBudget: spentMinor > seed.amountMinor,
        });
      }
      return {
        budgetId: seed.budgetId,
        categoryId: seed.categoryId,
        categoryName: seed.categoryName,
        periodKind: seed.periodKind,
        points,
      };
    }

    const rangeStart = seed.startDate > fromDate ? seed.startDate : fromDate;
    const rangeEnd =
      seed.endDate && seed.endDate < toDate ? seed.endDate : toDate;
    const periodKeys =
      seed.periodKind === 'weekly'
        ? listWeekKeys(rangeStart, rangeEnd)
        : listMonthKeys(rangeStart, rangeEnd);

    for (const period of periodKeys) {
      const spentMinor =
        seed.categoryId == null
          ? (spentLookup.get(`__all__|all:${period}`) ?? 0)
          : (spentLookup.get(`${seed.categoryId}|${period}`) ?? 0);
      points.push({
        period,
        budgetMinor: seed.amountMinor,
        spentMinor,
        overBudget: spentMinor > seed.amountMinor,
      });
    }

    return {
      budgetId: seed.budgetId,
      categoryId: seed.categoryId,
      categoryName: seed.categoryName,
      periodKind: seed.periodKind,
      points,
    };
  });
}
