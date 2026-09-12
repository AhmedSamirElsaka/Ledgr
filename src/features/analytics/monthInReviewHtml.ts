import {formatMoney, money, type CurrencyCode} from '../../domain/money/Money';
import {formatDate} from '../../i18n/formatDate';
import {getNumberLocale} from '../../i18n/formatLocale';

export type MonthInReviewReportInput = {
  title: string;
  monthLabel: string;
  baseCurrency: CurrencyCode;
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
  expenseCount: number;
  topCategories: Array<{name: string; totalMinor: number}>;
  topMerchant: string | null;
  largestLabel: string | null;
  largestMinor: number | null;
  streakCurrent: number;
  privacyNote: string;
  labels: {
    income: string;
    expense: string;
    net: string;
    expensesCount: string;
    topCategories: string;
    topMerchant: string;
    largest: string;
    streak: string;
    none: string;
  };
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function amount(minor: number, currency: CurrencyCode): string {
  return formatMoney(money(minor, currency), {
    locale: getNumberLocale(),
    signed: true,
  });
}

/** Calm on-device HTML report for month-in-review share (no upload). */
export function buildMonthInReviewHtml(input: MonthInReviewReportInput): string {
  const locale = getNumberLocale();
  const categoryRows =
    input.topCategories.length === 0
      ? `<tr><td colspan="2">${escapeHtml(input.labels.none)}</td></tr>`
      : input.topCategories
          .map(
            c =>
              `<tr><td>${escapeHtml(c.name)}</td><td>${escapeHtml(
                formatMoney(money(c.totalMinor, input.baseCurrency), {locale}),
              )}</td></tr>`,
          )
          .join('');

  const generated = formatDate(new Date(), 'PPP');

  return `<!DOCTYPE html>
<html lang="${locale.startsWith('ar') ? 'ar' : 'en'}" dir="${
    locale.startsWith('ar') ? 'rtl' : 'ltr'
  }">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(input.title)}</title>
<style>
  :root { color-scheme: light; }
  body {
    margin: 0;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    background: #F4F7F8;
    color: #0F1C1F;
    padding: 28px 20px 40px;
  }
  .card {
    max-width: 440px;
    margin: 0 auto;
    background: #FFFFFF;
    border-radius: 16px;
    border: 1px solid #E2E9EC;
    padding: 24px;
  }
  .eyebrow {
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 11px;
    color: #5B6B70;
    margin: 0 0 8px;
  }
  h1 { font-size: 26px; margin: 0 0 4px; font-weight: 650; }
  .month { color: #5B6B70; margin: 0 0 20px; }
  .hero {
    background: linear-gradient(145deg, #0A6F6A, #0F8F8A);
    color: #F4FFFE;
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 20px;
  }
  .hero .label { opacity: 0.8; font-size: 12px; margin: 0 0 6px; }
  .hero .net { font-size: 28px; font-variant-numeric: tabular-nums; margin: 0; }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }
  .stat {
    background: #F4F7F8;
    border-radius: 12px;
    padding: 12px;
  }
  .stat .k { font-size: 12px; color: #5B6B70; margin: 0 0 4px; }
  .stat .v { font-size: 16px; font-variant-numeric: tabular-nums; margin: 0; }
  h2 { font-size: 15px; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  td {
    padding: 8px 0;
    border-top: 1px solid #E2E9EC;
    font-size: 14px;
  }
  td:last-child { text-align: end; font-variant-numeric: tabular-nums; }
  .meta { font-size: 13px; color: #5B6B70; margin: 6px 0; }
  .privacy { font-size: 12px; color: #5B6B70; margin-top: 18px; }
</style>
</head>
<body>
  <article class="card">
    <p class="eyebrow">${escapeHtml(input.title)}</p>
    <h1>${escapeHtml(input.monthLabel)}</h1>
    <p class="month">${escapeHtml(generated)}</p>
    <div class="hero">
      <p class="label">${escapeHtml(input.labels.net)}</p>
      <p class="net">${escapeHtml(amount(input.netMinor, input.baseCurrency))}</p>
    </div>
    <div class="grid">
      <div class="stat">
        <p class="k">${escapeHtml(input.labels.income)}</p>
        <p class="v">${escapeHtml(
          formatMoney(money(input.incomeMinor, input.baseCurrency), {locale}),
        )}</p>
      </div>
      <div class="stat">
        <p class="k">${escapeHtml(input.labels.expense)}</p>
        <p class="v">${escapeHtml(
          formatMoney(money(input.expenseMinor, input.baseCurrency), {locale}),
        )}</p>
      </div>
    </div>
    <p class="meta">${escapeHtml(input.labels.expensesCount)}: ${
      input.expenseCount
    }</p>
    <p class="meta">${escapeHtml(input.labels.topMerchant)}: ${escapeHtml(
      input.topMerchant ?? input.labels.none,
    )}</p>
    <p class="meta">${escapeHtml(input.labels.largest)}: ${
      input.largestLabel == null || input.largestMinor == null
        ? escapeHtml(input.labels.none)
        : `${escapeHtml(input.largestLabel)} · ${escapeHtml(
            formatMoney(money(input.largestMinor, input.baseCurrency), {
              locale,
            }),
          )}`
    }</p>
    <p class="meta">${escapeHtml(input.labels.streak)}: ${input.streakCurrent}</p>
    <h2>${escapeHtml(input.labels.topCategories)}</h2>
    <table><tbody>${categoryRows}</tbody></table>
    <p class="privacy">${escapeHtml(input.privacyNote)}</p>
  </article>
</body>
</html>`;
}
