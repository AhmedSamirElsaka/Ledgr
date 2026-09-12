# PROGRESS

## Status — 2026-09-12

**Wave 4 polish closed** (empty-state CTAs/illustrations, motion audit, DESIGN.md final rubric). Waves 0–3 done except operator `[!]` device items. `npm run verify` is the gate for JS/TS quality.

### Remaining deferrals / sign-off blockers (honest)

| Item | Status |
|---|---|
| Stage 5 / U24 physical-device matrix | Checklist ready in `DEVICE_MATRIX.md` — **not run** (airplane, EN/AR, light/dark, 10k seed, process death) |
| Android release APK / iOS device build | Operator step; fail-closed signing in `android/app/build.gradle` (see README) |
| T12.4 cold-start <2s on mid-range device | Needs physical timing with 5k–10k rows; seed path documented below |
| T11.5 Android App Widget | Notifee action instead |
| Native PDF report | HTML month-in-review + HTML report share shipped |
| U11 reject SMS tx + ignore-similar | Shipped — Activity swipe/edit Reject + `sms.ignored_similar` settings patterns |
| U21 long-press drag reorder | Shipped — RNGH long-press pan among siblings; up/down a11y kept |
| F1.3 i18n debt sweep | Shipped — SMS rules/tester/forms, filters, add tx, budgets/subscriptions, backup alerts EN+AR |
| F2 UI/UX consistency | Shipped — ScreenBackdrop shells, FlashList `ListItemSeparator`, Add modal slide, a11y touch targets; device TalkBack leftover |
| F4 empty / motion / DESIGN scores | Shipped — Accounts/Categories/Home accounts illustrations; Insights empty CTA; ThemeProvider duration→0; code-reviewed ≥4 |

---

## Wave 4 — Delight polish (2026-09-12)

- **F4.1** Empty illustrations on Accounts, Categories, Home accounts card; Insights empty → Add expense (EN/AR)
- **F4.2** Motion audit: decorative wrappers static; `ThemeProvider.duration` always 0ms; category drag is finger-follow only
- **F4.3** DESIGN.md Wave 4 per-screen rubric (Home / Activity / Add / SMS / Insights / More) — code-reviewed, all ≥4

---

## Production polish — Stages 1–5 (2026-09)

### Stage 1 — Trust & money
- Typed JSON backup/restore (Zod per-table, referential checks, v1→v2 migration, `recurring_rules`)
- Forward migrations `002` (recurring + restore safety) and `003` (`receipt_path`)
- Transfer edit legs stay equal/opposite; FX resolve blocks missing rates (manual / SMS / CSV)
- App lock: salted PIN verifier, retry backoff, biometric access control; identity stays **`com.ledgr.app` only** (no package-id migration bridge)

### Stage 2 — Design & journeys
- Shared scaffolds (`ScreenScaffold`, `ListRow`, `FormSection`, `FeedbackBanner`, refresh helpers)
- EN/AR + RTL; pull-to-refresh; undo delete banner; duplicate on edit; SMS review-first inbox

### Stage 3 — Daily driver
- Receipt photos in app-private storage + backup `receipt_files`
- Recurring rules CRUD + due-on-open generation (`source='recurring'`)
- Templates, More search, archive from lists, category move up/down, notification quiet hours + privacy copy

### Stage 4 — Insights & import
- Balance history, budget adherence, recurring vs one-off SQL insights
- Chart prose summaries + month-in-review HTML share (on-device only)
- CSV import preview, mapping, duplicate skip, FX-safe transactional import

### Stage 5 — Hardening (in progress / this pass)
- Expanded Jest coverage: migrations 0→3, backup/receipt restore, transfer edits, FX, SMS dedupe/review, recurring generation, app lock, repositories, helpers
- **U11** Reject SMS transaction from Activity swipe/edit + ignore-similar patterns in settings (`sms.ignored_similar`)
- Docs aligned to shipped behavior; private-distribution privacy notes in product copy / DECISIONS
- **F2** ScreenBackdrop on bare list/form shells; FlashList row spacing via `ListItemSeparator` (no contentContainer `gap`); Add uses `slide_from_bottom`; SMS review + filter chip touch ≥44pt
- **F3.1–F3.5** operator checklists in `DEVICE_MATRIX.md`; README release signing corrected to fail-closed; physical runs remain `[!]`

### Wave 3 trust checklists (docs)

**F3.1 Money / transfer / FX** — Jest already covers:

| Concern | Primary tests |
|---|---|
| Transfer edit legs stay equal/opposite | `transactionsRepository.test.ts` |
| Missing FX blocks save / resolve | `fxRatesRepository.test.ts`, `importCsvService.test.ts`, `generateDueRecurring.test.ts` |
| SMS USD → base (or defer) | `processSms.test.ts` |
| Money domain | `Money.test.ts` |

Manual device notes: `DEVICE_MATRIX.md` §B.

**F3.2 Backup / restore / receipts** — Jest: `backupService.test.ts` (export/`receipt_files`/restore), `receiptStorage.test.ts`, CSV `schema`/`csv`/`importCsvService`. Manual smoke: `DEVICE_MATRIX.md` §C (export → wipe → restore with receipts; CSV preview).

**F3.3 / U24 Airplane matrix** — checklist ready in `DEVICE_MATRIX.md` §A; **physical sign-off blocked**.

**F3.5 Release readiness (docs vs code)** — package/namespace `com.ledgr.app`; ProGuard keeps SMS/receipts/`com.ledgr.app.**`; privacy notes match private-distribution copy; release signing **fail-closed** (no debug fallback). APK assemble remains operator `[!]`.

---

## Phase 12 — Performance

**Built**
- `src/db/seedLarge.ts` + More → Dev tools (__DEV__) seed 10k (idempotent via `seed.large.v1` unless force)
- Lists on **FlashList** (Transactions, Home, SMS, Budgets, More lists) with memoized rows + stable keys
- Activity pagination `PAGE_SIZE = 50`; end-reached loads more
- Tabs/stacks: `freezeOnBlur`, lazy tabs; Analytics refresh gated on focus
- Analytics: confirmed SQL-only aggregates in `AnalyticsRepository` (no full-table JS chart scans)
- Jest: `groupByDay.perf.test.ts` asserts 10k grouping **&lt; 500ms** (preserved under Stage 5)

**Measured (Jest / CI host)**

| Probe | Result |
|---|---|
| `groupTransactionsByDay(10_000)` | **~50–80ms** on CI host (budget 500ms) — see Jest `[perf]` log |
| Analytics path | SQL `GROUP BY` / `SUM` only; in-memory cache invalidated on writes |
| List virtualization | FlashList recycling; does not mount 10k rows |

**Cold start / 5k–10k (F3.4 / T12.4)**

| Item | Note |
|---|---|
| Dev seed path | __DEV__ More → Dev tools → Seed 10k → `seedLargeTransactions` |
| Expected list behavior | FlashList + `PAGE_SIZE=50`; open Activity/Home should scroll without mounting all rows / multi-second UI freeze |
| Optional timing | Log cold-open → interactive Home ms on mid-range with 5k–10k rows (target &lt;2s) — **not measured on device this pass** |
| Operator steps | `DEVICE_MATRIX.md` §D |

**Finish plan:** see `FINISH_PLAN.md` (remaining product / UI / release waves).

---

## Phase 13 — Design polish

**Motion:** `ScreenEnter`, `AnimatedFab`, `AnimatedTabIcon`, `AnimatedProgressBar`, keypad press feedback; all gated by reduce-motion / `duration()`.

**Visual:** Home amount hero + subtle teal atmospheric gradient; EmptyIllustration; analytics heatmap-lite + TOD bars; dark contrast bump; FAB bottom-safe.

**Scores:** All rubric criteria ≥4 — see `DESIGN.md` Phase 13 log.

---

## Phase 14 — Release

**Built**
- README: architecture, schema, debug/release, SMS, backup, airplane-mode DoD
- `android/keystore.properties.example` + release signing in `app/build.gradle`
- ProGuard keep rules for RN / reanimated / op-sqlite / mmkv / notifee / SMS package
- INTERNET kept for Metro; documented as unused by product features
- SMS `BroadcastReceiver` + `LedgrSmsReceived` native module + pending queue drain

---

## Phase 7–11 summary

**Built**
- SMS domain: rule engine, merchant cleanup, dedupe hash, auto-categorize (≥3); fixture corpus unit tests
- `smsRules` / `smsMessages` / `merchantAliases` repos; starter rules seeded; `processSmsMessage` → `source='sms'`
- Android inbox backfill (30 days) + permission rationale; iOS PasteImport; Review inbox, Rule Tester, Rules CRUD, generate-rule
- Subscriptions CRUD, cycle prediction tests, monthly/yearly totals, history auto-detect confirm, Notifee reminders, cancel keeps history
- Analytics SQL aggregations + in-memory cache; gifted-charts with theme colors; period selector; drill-downs; empty/single-point
- CSV export/import, JSON backup/restore (validate-first), HTML report share
- Onboarding ≤4 steps; app lock PIN/biometric + auto-lock gate; daily streak reminder; More settings entries
- Manifest: READ_SMS, RECEIVE_SMS, notifications, biometrics

**Updated deferrals**
- T7.4 real-time SMS → **shipped** (queue + JS emit)
- T9.3 → heatmap-lite, balance-over-time, budget adherence, recurring mix, month-in-review **HTML** shipped; native PDF still deferred
- T10.2 native PDF deferred (HTML report + month review share)
- T4.5 receipts / T5.3 tags → **shipped** in polish stages
- T11.5 Android App Widget deferred (Notifee “Add expense” action instead)

---

## Phase 3–6 summary

**Built**
- Tabs Home | Transactions | Analytics | More with nested stacks; `AppProviders` + DB loading/error gate
- Transactions list (day groups + search), add/edit with keypad-first flow, haptics
- Accounts CRUD + balances; categories list/form; manual FX + base currency; linked transfers
- Budgets repo + UI progress; remaining budget hint on AddTransaction; streak on Home
- `haptics` / `prefs` (MMKV) / `uiStore`; domain period + streak unit tests

---

## Phase 2 summary

**Built**
- `@op-engineering/op-sqlite` wired; `initDatabase` / `DatabaseProvider`
- Migration runner + `001_initial` schema (accounts → merchant_aliases)
- Seed categories + base_currency setting
- Repositories: settings, categories, accounts, transactions (+ soft delete)
- Change-event bus; purge hook on launch
- Unit tests for migrations + events

**EXPLAIN QUERY PLAN (device)**
- Recent list: `SEARCH transactions USING INDEX idx_transactions_list (deleted_at=?)`

**Chose**
- op-sqlite over nitro-sqlite (see DECISIONS)

---

## Phase 1 summary

Design tokens, theme, primitives, Lucide, Money/Amount, gallery on emulator.

---

## Phase 0 summary

RN 0.87.1 CLI template, toolchain verified, git + `npm run verify` guardrails.

---

## Toolchain check (T0.1)

| Tool | Result |
|---|---|
| `node -v` | v22.19.0 |
| `npm -v` | 10.9.3 |
| `java -version` | OpenJDK 17.0.16 (Zulu 17) |
