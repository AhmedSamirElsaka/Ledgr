import {groupTransactionsByDay} from '../groupByDay';
import {makeMockTransactions} from '../perfFixtures';

const BUDGET_MS = 500;

describe('groupTransactionsByDay performance', () => {
  it(`groups 10k rows under ${BUDGET_MS}ms`, () => {
    const rows = makeMockTransactions(10_000);
    const started = Date.now();
    const groups = groupTransactionsByDay(rows);
    const elapsed = Date.now() - started;

    expect(groups.length).toBeGreaterThan(50);
    expect(groups.reduce((n, g) => n + g.transactions.length, 0)).toBe(10_000);
    expect(elapsed).toBeLessThan(BUDGET_MS);

    // Helps CI logs / PROGRESS.md capture.
    console.log(`[perf] groupByDay(10k)=${elapsed.toFixed(1)}ms groups=${groups.length}`);
  });
});
