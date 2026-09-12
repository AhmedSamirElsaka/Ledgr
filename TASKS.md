# TASKS

Living checklist for the offline-first Ledgr app. One task at a time: implement → `npm run verify` → exercise on device → self-review → check off → update `PROGRESS.md` / `USER_TASKS.md`.

**Do not commit or push** — see `.cursor/rules/local-only-git.mdc` and `USER_TASKS.md` for the perfection backlog.

Status: `[ ]` pending · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Phase 0 — Bootstrap and tooling

- [x] **T0.1** Toolchain check (Node, npm, Java, adb, ANDROID_HOME)
  - AC: All required tools present and versions reported in PROGRESS.md
- [x] **T0.2** Init React Native CLI TypeScript project (current stable)
  - AC: Project exists with RN template; `package.json` present
- [x] **T0.3** Blank app builds and launches on Android device/emulator
  - AC: `npm run android` installs and opens `MainActivity`
- [x] **T0.4** `git init`, sensible `.gitignore`, initial template commit
  - AC: Clean root commit of untouched template
- [x] **T0.5** Guardrails: strict TS, ESLint (+ import order, unused imports), Prettier, Jest+RNTL, `typecheck` + `verify` scripts
  - AC: `npm run verify` passes with zero errors and zero warnings
- [x] **T0.6** Create `TASKS.md`, `DECISIONS.md`, `DESIGN.md`, `PROGRESS.md`
  - AC: All four files exist with purpose and initial content
- [x] **T0.7** Commit Phase 0 guardrails + docs
  - AC: Second commit after template; working tree clean

---

## Phase 1 — Design system and primitives

- [x] **T1.1** Design tokens: color (semantic), spacing (4pt), radii, elevation, motion, type scale
  - AC: Tokens in `src/design/tokens`; no hex/magic numbers outside token layer; documented in DESIGN.md
- [x] **T1.2** Theme provider (light / dark / system) wired to tokens
  - AC: Theme switches; reduce-motion respected via OS setting
- [x] **T1.3** Primitives: Text, Button, IconButton, Card, Input, Pressable, Skeleton, EmptyState, ErrorState, Sheet shell
  - AC: Each primitive uses tokens only; a11y labels; touch targets ≥ 44pt
- [x] **T1.4** Icon set chosen and wrapped (single family)
  - AC: One icon package; wrapper component; decision recorded
- [x] **T1.5** Amount / Money display components with tabular numerals
  - AC: Currency symbol placement, grouping, negative treatment correct for EGP/USD/JPY/KWD samples
- [x] **T1.6** Design polish loop on primitive gallery / smoke screen
  - AC: All rubric criteria ≥ 4; scores in DESIGN.md

---

## Phase 2 — Database, migrations, repositories, seed

- [x] **T2.1** Pick SQLite library (`op-sqlite` vs `nitro-sqlite`); wire native
  - AC: Open/close DB on device; decision in DECISIONS.md
- [x] **T2.2** Schema v1 for all domain tables + indexes
  - AC: Matches data model in brief; money as integer minor units
- [x] **T2.3** Versioned migration runner (`user_version`, forward-only)
  - AC: Unit tests for apply; idempotent on relaunch
- [x] **T2.4** Seed default categories (icons/colors) on first launch
  - AC: Seed runs once; categories editable later
- [x] **T2.5** Repository base: typed queries + change-event bus (no polling)
  - AC: Write emits event; subscriber notified; screens never import SQL
- [x] **T2.6** `EXPLAIN QUERY PLAN` for key transaction queries; fix missing indexes
  - AC: Plans reported in DECISIONS.md or PROGRESS.md; indexes cover WHERE/ORDER BY
- [x] **T2.7** Soft-delete + 30-day purge job hook
  - AC: Soft-deleted hidden from default lists; purge removes after 30 days

---

## Phase 3 — Navigation shell and app skeleton

- [x] **T3.1** React Navigation v7: native stack + bottom tabs
  - AC: Tabs: Home, Transactions, Analytics, More; stacks nested
- [x] **T3.2** App providers composition (theme, gesture handler, safe area, DB ready gate)
  - AC: Cold start shows designed loading until DB ready
- [x] **T3.3** Placeholder screens for each tab with empty states
  - AC: Empty states designed; one-handed FAB zone reserved on Home
- [x] **T3.4** Design polish loop on shell
  - AC: Rubric ≥ 4 on all shell screens light+dark

---

## Phase 4 — Transactions CRUD

- [x] **T4.1** Domain: Money value type + zod schemas for transactions
  - AC: Unit tests for arithmetic/rounding; no float money in app code
- [x] **T4.2** Transactions repository (CRUD, soft delete, filters)
  - AC: Covered by unit tests; emits change events
- [x] **T4.3** Add transaction screen: numeric keypad first, category grid, account, date shortcuts, note, tags
  - AC: Common expense path < 5s; expense/income/transfer; remaining budget hint stub-ready
- [x] **T4.4** Edit transaction + history-safe updates
  - AC: Edit preserves created_at; updates updated_at; transfer pairs stay consistent
- [x] **T4.5** Optional receipt photo in app-private storage
  - AC: Attach/remove; not readable by other apps
  - Shipped in production polish Stage 3 (`receipt_path` + backup `receipt_files`)
- [x] **T4.6** Haptics on save; design polish loop
  - AC: Rubric ≥ 4; haptics only on commit

---

## Phase 5 — Accounts, categories, tags, multi-currency

- [x] **T5.1** Accounts CRUD + archive; balance computation
  - AC: Opening balance + transactions = displayed balance
- [x] **T5.2** Categories CRUD with one-level nesting; reorder; archive
  - AC: Expense/income kinds; most-used ordering for picker
- [x] **T5.3** Tags + transaction_tags
  - AC: Multi-tag on transaction; search by tag works later
  - Shipped (U1); tags CRUD + filter on Activity
- [x] **T5.4** FX rates table (manual) + base currency setting
  - AC: Historical tx keep stored fx_rate_to_base; editing rate does not rewrite history
- [x] **T5.5** Transfers between accounts
  - AC: Creates linked pair; balances move correctly
- [x] **T5.6** Settings screens for accounts/categories/currencies
  - AC: Usable one-handed; empty/error states designed

---

## Phase 6 — Budgets

- [x] **T6.1** Budgets repository + period math (weekly/monthly/custom) + rollover
  - AC: Unit tests for period boundaries and rollover
- [x] **T6.2** Budgets list + create/edit UI with live progress
  - AC: Progress bar; warning before overspend; projected end-of-period
- [x] **T6.3** Remaining budget inline on add-expense for matching category
  - AC: Shows remaining while category selected
- [x] **T6.4** Design polish loop
  - AC: Rubric ≥ 4 light+dark

---

## Phase 7 — SMS engine (Android) + paste fallback (iOS)

- [x] **T7.1** `sms_rules` / `sms_messages` repos + rule engine (sender + regex named groups)
  - AC: Unit tests with fixture corpus; priority ordering
- [x] **T7.2** Starter rules (broad, pattern-based — not invented bank formats)
  - AC: Seeded; editable; documented in README later
- [x] **T7.3** Android: backfill via `react-native-get-sms-android` (last N days)
  - AC: Permission rationale; denial handled; airplane mode unaffected after grant
- [x] **T7.4** Android: real-time `SMS_RECEIVED` receiver (package or custom native module)
  - AC: Works with app swiped away where OS allows; Doze notes in DECISIONS
  - Custom `SmsReceiver` queues SharedPreferences + emits via `LedgrSmsReceived`; drained on bootstrap / inbox scan
- [x] **T7.5** Duplicate protection (sender+amount+time window hash)
  - AC: Rescan does not double-log
- [x] **T7.6** Merchant cleanup + alias table + auto-categorization from history
  - AC: Uber×3 → auto Transport marked auto-assigned
- [x] **T7.7** Review inbox + Rule Tester + generate-rule-from-message
  - AC: Live match preview; one-tap rule creation
- [x] **T7.8** iOS: hide SMS feature; paste-a-message import using same engine
  - AC: No dead toggles on iOS
- [x] **T7.9** Design polish loop
  - AC: Rubric ≥ 4

---

## Phase 8 — Subscriptions

- [x] **T8.1** Subscriptions CRUD + cycle prediction
  - AC: Unit tests for monthly/yearly/custom next due
- [x] **T8.2** Monthly/yearly cost totals UI
  - AC: Totals correct with multi-currency via base
- [x] **T8.3** Local reminders via Notifee (days before)
  - AC: Notification fires in emulator test; settings for lead days
- [x] **T8.4** Auto-detect from history (same merchant, similar amount, ~30/365d, ×3)
  - AC: Prompt to confirm; cancel keeps history
- [x] **T8.5** Design polish loop
  - AC: Rubric ≥ 4

---

## Phase 9 — Analytics

- [x] **T9.1** Analytics SQL aggregations + result cache invalidated on write
  - AC: Unit tests for each aggregation; no full-table JS scans
- [x] **T9.2** Global period selector + filter set shared across charts
  - AC: Changing period refreshes all charts
- [~] **T9.3** Charts: spend over time, category donut+list, drill-down, top merchants, income vs expense, cash flow, heatmap, DOW/TOD patterns, averages/medians, largest tx, budget adherence, recurring vs one-off, balance-over-time, streaks, month-in-review export image
  - AC: Empty + single-point states; tappable → filtered transactions; a11y text summaries
  - Shipped core charts; deferred heatmap, balance-over-time, budget adherence chart, month-in-review image
- [x] **T9.4** Chart library chosen (Gifted vs Skia) and styled to tokens
  - AC: Decision recorded; not default theme look
- [x] **T9.5** Design polish loop
  - AC: Rubric ≥ 4

---

## Phase 10 — Reports, export, backup, restore

- [x] **T10.1** CSV export of filtered transactions
  - AC: Share sheet; correct columns and money formatting
- [~] **T10.2** PDF report with charts
  - AC: Generates and shares file offline
  - Shipped HTML report share; native PDF deferred
- [x] **T10.3** Full JSON backup of DB
  - AC: User-chosen path/share; includes settings
- [x] **T10.4** Restore: validate then transactional apply
  - AC: Invalid backup rejected without touching live data
- [x] **T10.5** Generic CSV import with column mapping
  - AC: Preview; map; import; duplicates handled sanely

---

## Phase 11 — Notifications, streaks, app lock, widget

- [x] **T11.1** Tracking streak calculation + home display
  - AC: Unit tests; longest streak in analytics
- [x] **T11.2** Daily reminder notification
  - AC: Configurable time; works offline
- [x] **T11.3** App lock: biometric or PIN + auto-lock delay
  - AC: Gate on resume; skippable in onboarding; settings re-runnable
- [x] **T11.4** Onboarding (≤4 screens): base currency, first account, SMS permission (Android), app lock
  - AC: Skippable; re-runnable from settings
- [!] **T11.5** Android home-screen widget (today spend + remaining budget)
  - AC: Updates after writes when possible
  - Deferred: shipped Notifee “Add expense” notification action instead
- [x] **T11.6** Quick entry shortcut (notification / QS where feasible)
  - AC: Opens add-expense flow

---

## Phase 12 — Performance pass

- [x] **T12.1** Generate 10,000 transactions fixture
  - AC: Script or in-app seed; documented
- [x] **T12.2** Virtualized transactions list stays smooth at 10k
  - AC: Performance test asserts budget; numbers in PROGRESS.md
- [x] **T12.3** Analytics dashboard render within budget at 10k
  - AC: Numbers reported; SQL-only aggregates confirmed
- [~] **T12.4** Cold start < 2s interactive with 5k tx on mid-range device
  - AC: Measured; reported; regressions addressed
  - Note: Device timing deferred — JS groupByDay + SQL aggregates verified in CI; cold-start measure needs a physical mid-range pass

---

## Phase 13 — Design polish pass

- [x] **T13.1** Full-app design polish loop (every screen, light+dark)
  - AC: All criteria ≥ 4 or two consecutive no-change iterations; scores in DESIGN.md
- [x] **T13.2** Accessibility audit: labels, dynamic type 130%, contrast 4.5:1
  - AC: Issues fixed; charts have text alternatives

---

## Phase 14 — Release build and install instructions

- [x] **T14.1** Personal signing keystore + release variant wiring (credentials gitignored)
  - AC: Release APK builds signed
- [x] **T14.2** ProGuard/R8 rules for reflection-dependent libs
  - AC: Release APK runs core flows
- [x] **T14.3** Airplane-mode + no-network-permission verification
  - AC: All features work; only SMS needs prior permission grant
  - Note: INTERNET kept for Metro debug; documented as unused by product features
- [x] **T14.4** README: architecture, schema, debug/release build, SMS rules, backup/restore
  - AC: Follow README alone to install release APK
- [~] **T14.5** End-to-end on device: add tx, parse real SMS, budget warning, all analytics with real data
  - AC: Checklist signed off in PROGRESS.md
  - Note: Manual device checklist remains for the operator after install
