# Ledgr

Offline-first personal expense tracker (React Native CLI). Money stays on-device in SQLite; no cloud sync.

Brand assets live in `assets/brand/` (app icon, splash logo, onboarding hero). Native splash uses `react-native-bootsplash` (teal `#0A4F4C`).

## Architecture

| Layer    | Location                                            | Role                                                    |
| -------- | --------------------------------------------------- | ------------------------------------------------------- |
| Features | `src/features/<feature>/{screens,components,hooks}` | Thin screens; local UI + data hooks                     |
| Domain   | `src/domain/*`                                      | Pure logic: money, SMS rules, budgets, backup CSV/JSON  |
| DB       | `src/db/*`                                          | op-sqlite connection, migrations, repositories, seed    |
| Design   | `src/design/*`                                      | Tokens, theme, primitives, motion, Lucide Icon registry |
| App      | `src/app/`                                          | Bootstrap, providers, navigation stacks                 |
| i18n     | `src/i18n/`                                         | English / Arabic locales, RTL layout restart            |
| Native   | `android/…/sms`, `src/native`                       | SMS_RECEIVED BroadcastReceiver + JS bridge              |

Engineering guide: `CLAUDE.md`. Cursor rules: `.cursor/rules/` (adapted from Ejar; Ledgr-specific). Local-only git: never commit/push.

Tabs: **Home | Transactions | Analytics | More**. Nested stacks for forms. App lock + onboarding gate in `AppBootstrap`. Language: **English / العربية** under More → Language (RTL switch restarts the app).

## Schema overview

SQLite schema v1 (`src/db/migrations/001_initial.ts`):

- **accounts**, **categories**, **transactions** (integer minor units, soft delete)
- **tags** / **transaction_tags** (UI under Add/Edit + More)
- **budgets**, **subscriptions**, **sms_rules**, **sms_messages**, **merchant_aliases**
- **settings**, **fx_rates**, indexes on list/occurred_at paths

Analytics use **SQL aggregates only** (`AnalyticsRepository`) — no full-table JS scans for charts.

## Tooling

```sh
npm install
npm start                 # Metro
npm run android           # Debug APK on device/emulator
npm run verify            # typecheck + lint + jest
```

**Language:** UI strings live in `src/i18n/locales/` (en + ar). Changing between English and Arabic restarts the app when layout direction changes so RTL applies correctly.

## Debug vs release (Android)

### Debug

```sh
npm start
npm run android
```

`INTERNET` is declared so Metro / Flipper can talk to the device. **App features do not require network** — verify airplane mode after install.

### Release APK (signed)

1. Generate a personal keystore (do **not** commit it):

```sh
keytool -genkeypair -v -storetype PKCS12 \
  -keystore android/app/release.keystore \
  -alias ledgr \
  -keyalg RSA -keysize 2048 -validity 10000
```

2. Copy `android/keystore.properties.example` → `android/keystore.properties` and fill passwords. Both `keystore.properties` and `*.keystore` / `*.jks` are gitignored.

3. Build:

```sh
cd android
./gradlew assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`

Install:

```sh
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Release signing is **fail-closed**: if `android/keystore.properties` is missing/incomplete or the keystore file does not exist, `assembleRelease` / `bundleRelease` throws a `GradleException`. Debug builds do not need a release keystore. There is **no** debug-keystore fallback for release.

R8/ProGuard is enabled for release; keep rules live in `android/app/proguard-rules.pro` (op-sqlite, reanimated, mmkv, notifee, custom SMS + receipts packages under `com.ledgr.app`).

## SMS rules how-to

1. **Android**: More → SMS inbox → grant READ_SMS / RECEIVE_SMS when prompted → **Import from SMS**. Permissions are requested only on that action (not at cold start).
2. Real-time: `SmsReceiver` queues `SMS_RECEIVED` into SharedPreferences and emits to JS when the app is alive; pending drain runs on bootstrap and on scan. Review alerts are normal notifications (no full-screen intent).
3. **iOS**: More → Paste SMS import (no inbox API).
4. Tune rules: Rule tester → Manage rules → Generate rule from a needs-review message.
5. Starter bank/wallet rules seed on first launch (`seedSmsRules`).

## Private distribution & privacy

Ledgr is intended for **private / sideloaded Android distribution**, not Play Store SMS policy compliance theater. Money and SMS stay on-device (SQLite + MMKV; no backend or telemetry).

- **SMS** (`READ_SMS` / `RECEIVE_SMS`) remains available in private builds. Runtime prompts happen at inbox import / enable — not aggressively on cold start. Onboarding only explains the optional feature.
- **Notifications** (`POST_NOTIFICATIONS`) are requested when enabling reminders or after SMS import (for review alerts).
- **Lock-screen copy** defaults to redacted / generic titles. More → Notifications can opt into richer details (amounts, senders, subscription names). Secure lock screens still get a public redacted version for SMS review alerts.
- **No `USE_FULL_SCREEN_INTENT`** — SMS review uses a normal notification the user taps.

## Backup / restore

More → Backup & export:

- **CSV** export/import of transactions
- **JSON** full backup/restore, including recurring rules
- **HTML** shareable report

Files are written on-device and shared via the system share sheet — nothing is uploaded by the app.
JSON backups use typed per-table schemas (`version: 2`); existing `version: 1`
backups are migrated during validation. Restore shows a row-count preview,
checks references before touching SQLite, requires destructive confirmation,
and writes a pre-restore safety backup before the transactional replacement.

## Performance fixtures (**DEV**)
More → Dev tools → **Seed 10k transactions** (`src/db/seedLarge.ts`). Jest also benches `groupTransactionsByDay(10k)` under 500ms — see `PROGRESS.md`.

## Airplane-mode DoD

With airplane mode on (after any SMS permission was already granted if testing SMS):

- Add/edit transactions, budgets, analytics, backup/export, app lock all work.
- SMS inbox scan needs prior permission; live SMS still queues when radio allows SMS but no data.

Operator checklist (steps + expected results + sign-off tables): **`DEVICE_MATRIX.md`**. Physical device run is still pending.

## Docs

- `TASKS.md` — phase checklist
- `PROGRESS.md` — status + perf numbers
- `DEVICE_MATRIX.md` — airplane / money / backup / release operator checklists
- `DESIGN.md` — tokens + polish scores
- `DECISIONS.md` — library choices
