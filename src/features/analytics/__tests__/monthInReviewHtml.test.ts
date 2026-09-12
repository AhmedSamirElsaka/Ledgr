import {buildMonthInReviewHtml} from '../monthInReviewHtml';

jest.mock('../../../i18n/formatLocale', () => ({
  getNumberLocale: () => 'en-US',
}));

jest.mock('../../../i18n/formatDate', () => ({
  formatDate: () => 'September 10, 2026',
}));

describe('buildMonthInReviewHtml', () => {
  it('renders localized labels and does not invent remote urls', () => {
    const html = buildMonthInReviewHtml({
      title: 'Ledgr month in review',
      monthLabel: 'September 2026',
      baseCurrency: 'EGP',
      incomeMinor: 100000,
      expenseMinor: 40000,
      netMinor: 60000,
      expenseCount: 12,
      topCategories: [{name: 'Food', totalMinor: 25000}],
      topMerchant: 'Cafe',
      largestLabel: 'Rent',
      largestMinor: 15000,
      streakCurrent: 3,
      privacyNote: 'On device only',
      labels: {
        income: 'Income',
        expense: 'Expense',
        net: 'NET',
        expensesCount: 'Expenses',
        topCategories: 'Categories',
        topMerchant: 'Top merchant',
        largest: 'Largest',
        streak: 'Streak',
        none: 'None yet',
      },
    });

    expect(html).toContain('September 2026');
    expect(html).toContain('Food');
    expect(html).toContain('On device only');
    expect(html).not.toContain('http://');
    expect(html).not.toContain('https://');
  });

  it('renders an honest empty month without fabricating category spend', () => {
    const html = buildMonthInReviewHtml({
      title: 'Ledgr month in review',
      monthLabel: 'September 2026',
      baseCurrency: 'EGP',
      incomeMinor: 0,
      expenseMinor: 0,
      netMinor: 0,
      expenseCount: 0,
      topCategories: [],
      topMerchant: null,
      largestLabel: null,
      largestMinor: null,
      streakCurrent: 0,
      privacyNote: 'On device only',
      labels: {
        income: 'Income',
        expense: 'Expense',
        net: 'NET',
        expensesCount: 'Expenses',
        topCategories: 'Categories',
        topMerchant: 'Top merchant',
        largest: 'Largest',
        streak: 'Streak',
        none: 'None yet',
      },
    });

    expect(html).toContain('None yet');
    expect(html).toContain('0');
    expect(html).not.toContain('Food');
  });
});
