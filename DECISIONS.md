# DECISIONS

One-line (or short) records of non-obvious choices. Newest first within a phase.

## Production polish (Stages 1–5)

- **App identity is always `com.ledgr.app`.** No Android/iOS package-id migration bridge; JSON backup/restore is the data portability path. Re-enroll app-lock PIN rather than exporting secrets.
- **Backup schema v2** includes typed per-table Zod schemas, referential preflight, `recurring_rules`, optional `receipt_path` / `receipt_files`, and validate-before-replace restore. Invalid backups never open a write transaction.
- **Forward migrations only:** `002` recurring + restore safety indexes; `003` `receipt_path` on transactions. Compatibility DB filename retained to avoid silent data loss.
- **Transfer edits update both legs in one transaction** with equal-and-opposite amounts; changing account/type on a transfer leg is rejected.
- **FX rates must resolve at write time** (manual, SMS, CSV, recurring). Missing/invalid rates surface typed errors — never silent `1.0` for foreign currency.
- **App lock stores a PBKDF2 PIN verifier** in Keychain (not plaintext); failed attempts back off without permanent lockout; biometric uses `BIOMETRY_CURRENT_SET`.
- **Receipt images** live under app-private `receipts/` relative paths; backups embed base64 only for managed paths; restore rewrites files then orphans unused ones.
- **Recurring generation** is idempotent via `source_ref = recurring:<ruleId>:<occurredAt>`; due-on-open; FX-blocked rules leave the pointer unmoved.
- **Month-in-review** shares local HTML via the system share sheet — no upload, no remote URLs in the report.
- **CSV import** requires preview/mapping, transactional insert, duplicate skip reporting, and FX resolution before commit.
- **On-device Smart Assist (free):** category memory in settings (`smart.category_memory`), keyword merchant hints, fuzzy history matching — improves SMS review + Add suggestions without network/paid APIs.
- **Release signing fail-closed** for Android release builds (no silent debug keystore fallback) — see `android/app/build.gradle`.

## Phase 7–11

- **Charts: `react-native-gifted-charts`** styled with `theme.colors.chart.*` (teal series, not default purple). Skia deferred for colder start / less native surface area.
- **SMS real-time: custom `BroadcastReceiver`.** `react-native-get-sms-android` exposes inbox `list`; `SmsReceiver` + `LedgrSmsReceived` handle live queueing. Doze may delay background delivery even with a receiver.
- **SMS starter rules use broad regex + any-sender (`/.*/i`).** Not invented bank formats; users tighten sender patterns in Rules UI.
- **PDF reports deferred; HTML report shared via RNFS + Share.** Prefer working CSV/JSON restore path over fragile `react-native-html-to-pdf`.
- **Android home-screen widget deferred.** Delivered Notifee daily reminder with “Add expense” action instead (T11.6).
- **App lock: PIN in react-native-keychain + optional biometric prompt; auto-lock delay in MMKV.** Gate wraps RootNavigator in AppBootstrap after onboarding.
- **Backup restore validates Zod schema before any DELETE/INSERT.** Invalid JSON never touches live tables.
- **Analytics cache is in-memory on AnalyticsRepository**, invalidated via `subscribeDbChanges` on transactions/budgets/categories.

## Phase 3–6

- **Navigation: nested native stacks inside bottom tabs.** Home/Transactions own `AddTransaction` modals; More owns settings CRUD stacks.
- **Transfers store signed `amount_minor` (out negative / in positive).** Expense/income stay positive with type-driven balance math — avoids UUID-order ambiguity on pairs.
- **FX rates are quote→base multipliers stored at write time.** Editing the FX table never rewrites historical `fx_rate_to_base`.
- **MMKV via `createMMKV` for UI prefs only;** durable settings stay in SQLite `settings` table.
- **FlatList (not FlashList)** — `@shopify/flash-list` was not in the installed set; day-grouped list is virtualized enough for Phase 4.
- **Babel: only `react-native-reanimated/plugin`.** It re-exports `worklets/plugin`; listing both fails Babel with duplicate plugin.

## Phase 7+

- **Patched `react-native-get-sms-android`** (remove `jcenter()`, AGP `namespace "com.react"`, drop manifest `package=`) via `patch-package`.
- **`react-native.config.js`** forces `com.react.SmsPackage` import (autolinking wrongly used `com.react.SmsAndroid`).
- **Pinned `zod@3`** for Metro; Babel `export-namespace-from` kept as backup.
- **RNTL 14 peer `test-renderer`** installed.
- Note: a custom `SmsReceiver` native module was later added (Phase 12–14) for real-time queueing — supersedes the earlier “receiver deferred” note for inbox list only.

## Phase 2

- **SQLite: `@op-engineering/op-sqlite@18.2.1`.** Actively maintained, C++/JSI, fits offline-only app; nitro-sqlite deferred.
- **Hand-rolled `user_version` migrations + `SqlDatabase` wrapper.** Keeps migration unit tests free of native modules.
- **Change bus in `src/db/events.ts`.** Repos emit after writes; screens subscribe — no polling.

## Phase 1

- **Icon set: Lucide via `lucide-react-native` + `react-native-svg`.** Single family, tree-shakeable closed registry in `Icon.tsx` (add icons as needed).
- **Typography: platform UI sans + `fontVariant: tabular-nums`.** Skips bundling a custom face for cold-start budget; amounts still align in columns.
- **Sheet primitive is a Modal shell for now.** `@gorhom/bottom-sheet` lands with navigation/gesture-handler in Phase 3 — same call-site shape.
- **Disabled `react-native/no-inline-styles`.** Theme tokens are dynamic; StyleSheet.create cannot read context.
- **Accent: teal `#0F8F8A` / `#2DB5AF`.** Confident without purple-indigo AI cliché; cool neutrals base.

## Phase 0

- **Skipped `create-rn-foundation` skill generator.** Brief requires offline-first, Zustand, no network client, no Redux/Axios/Firebase; the foundation generator pulls the opposite stack. Used RN Community CLI template instead.
- **React Native 0.87.1** — current stable from CLI init at project creation time; do not pin older.
- **Package / bundle ID `com.ledgr.app`** — Android `applicationId`/`namespace` and iOS `PRODUCT_BUNDLE_IDENTIFIER` share this id.
- **RNTL without `@testing-library/jest-native`.** Package is deprecated; RNTL ≥12.4 includes built-in Jest matchers.
- **`noUncheckedIndexedAccess: true`** enabled on top of RN’s `strict: true` per brief.
- **Path alias `@/*` → `./src/*` without `baseUrl`.** TypeScript 6 deprecates `baseUrl`; paths use explicit prefixes (TS 6 migration guidance).
- **Branch name `master`** — git default on this machine; not renaming unless asked (avoids `git config`).
