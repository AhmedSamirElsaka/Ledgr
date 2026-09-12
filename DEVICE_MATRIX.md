# Device matrix — Ledgr operator checklists

Physical-device / operator sign-off for private release.  
**Status:** checklist ready · **physical run:** blocked until device (`[!]`).

Record pass/fail in the **Sign-off** tables. Jest coverage is listed so CI can green without a handset.

---

## How to use

1. Install a **debug** build for functional smoke, or a **release** APK once signing is configured (see README).
2. Prefer airplane mode (or disable Wi‑Fi + mobile data) for offline DoD.
3. Tick expected results; note OS version, EN/AR, light/dark, and build type.
4. Do **not** mark Wave 3 / U24 done until the Sign-off row is filled on a real device.

---

## A — Airplane-mode smoke (F3.3 / U24)

**Precondition:** Airplane mode **on**. If testing SMS import, grant SMS permission **before** enabling airplane mode (Android).

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| A1 | Cold-open app | Home loads; no network error banners; DB usable | |
| A2 | Add expense (keypad) → save | Row appears on Home / Activity; amount correct | |
| A3 | Edit that expense (note/category) | Changes persist after leaving screen | |
| A4 | Soft-delete → undo banner | Delete soft-deletes; undo restores | |
| A5 | Budgets: open list / progress | Periods compute from local DB; no spinner forever | |
| A6 | Analytics: open Insights, change period | Charts/summaries render from SQL aggregates | |
| A7 | More → Backup & export → share JSON or CSV | System share sheet opens; file is local (nothing uploaded) | |
| A8 | App lock: lock → unlock (PIN/biometric) | Gate works offline | |
| A9 | *(Android, optional)* SMS inbox scan with prior permission | Inbox/list loads from device SMS; no crash if radio off | |
| A10 | *(Android, optional)* Live SMS while airplane still allows SMS | Message queues / appears for review when app opens (no data needed) | |

**Sign-off (physical):** pending — blocked until device.

| Field | Value |
|-------|--------|
| Device / OS | |
| Build (debug/release) | |
| Locale (EN/AR) + theme | |
| Operator + date | |
| Result | ☐ Pass · ☐ Fail (notes: ) |

---

## B — Money / transfer / FX regression (F3.1)

### Automated (Jest) — run via `npm run verify`

| Area | Test file(s) | What is covered |
|------|----------------|-----------------|
| Money arithmetic / format | `src/domain/money/__tests__/Money.test.ts` | Integer minors, FX-safe same-currency ops, formatting |
| Transfer edit legs | `src/db/repositories/__tests__/transactionsRepository.test.ts` | Equal/opposite legs, FX on pair, block account/type change, malformed pair |
| Missing FX block | `src/db/repositories/__tests__/fxRatesRepository.test.ts` | `MissingFxRateError` / resolve to base |
| SMS USD → base | `src/db/sms/__tests__/processSms.test.ts` | Converts with stored rate; **defers** when FX missing |
| CSV FX / transfers | `src/db/backup/__tests__/importCsvService.test.ts` | Fail before write if FX missing; reject transfer rows without partial import |
| Recurring FX | `src/db/recurring/__tests__/generateDueRecurring.test.ts` | Blocks foreign dues without rate |

### Manual notes (device / emulator)

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| B1 | Create linked transfer between two accounts | Two opposite legs; balances move correctly | |
| B2 | Edit transfer amount / note (not account) | Both legs stay equal and opposite | |
| B3 | Add expense in USD with no FX rate | Save blocked with clear missing-rate message | |
| B4 | Add USD→EGP rate, then save USD expense | `base_amount` uses rate; Analytics in base currency OK | |
| B5 | *(Android)* SMS in USD with rate present / absent | Tracks with conversion **or** needs-review when rate missing | |

**Sign-off (physical):** pending — blocked until device. Jest green is enough for F3.1 code AC; device rows optional hardening.

---

## C — Backup / restore / receipts smoke (F3.2)

### Automated (Jest)

| Area | Test file(s) | What is covered |
|------|----------------|-----------------|
| JSON schema / v1→v2 | `src/domain/backup/__tests__/schema.test.ts` | Typed backup validation |
| Export + restore + receipts | `src/db/backup/__tests__/backupService.test.ts` | `receipt_path` + `receipt_files`; restore after validate; orphans cleaned |
| Receipt storage | `src/db/receipts/__tests__/receiptStorage.test.ts` | App-private paths / collect-restore helpers |
| CSV preview path | `src/domain/backup/__tests__/csv.test.ts`, `importCsvService.test.ts` | Parse/map; FX-safe import; no silent partial transfer import |

### Manual checklist

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| C1 | Add expense with receipt photo | Preview works; file in app-private storage | |
| C2 | More → Backup → export **JSON** (share/save) | File includes transactions + `receipt_files` when receipts exist | |
| C3 | Note approximate row counts (or screenshot preview) | Preview / confirmation shows counts before replace | |
| C4 | Wipe or clear demo / restore over existing data | Destructive confirm required; pre-restore safety backup written | |
| C5 | Restore the JSON from C2 | Accounts/txs/recurring match; receipt opens again | |
| C6 | CSV export → CSV import with preview | Mapping UI; duplicates skipped as designed; no silent data loss | |
| C7 | Optional: restore invalid/truncated JSON | Validation fails **before** SQLite replace | |

**Sign-off (physical):** pending — blocked until device.

---

## D — Cold start / large seed (F3.4) — operator note

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| D1 | __DEV__ More → Dev tools → Seed 10k (`seedLarge.ts`) | Completes without UI freeze; flag prevents re-seed | |
| D2 | Open Activity / Home lists | FlashList scrolls; pagination (`PAGE_SIZE=50`); no blank multi-second freeze | |
| D3 | Optional: time cold start to interactive Home | Target mid-range &lt;2s with ~5k rows (T12.4) — record ms | |

**Measured on CI host (not device):** `groupTransactionsByDay(10_000)` ~50–80ms (budget 500ms). See `PROGRESS.md` Phase 12.

**Sign-off (physical cold-start timing):** pending — blocked until device.

---

## E — Release APK assembly (F3.5 operator)

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| E1 | `android/keystore.properties` + keystore present | Matches `keystore.properties.example` fields | |
| E2 | `./gradlew assembleRelease` **without** keystore | **Fails closed** (GradleException) — no debug-signed release | |
| E3 | `./gradlew assembleRelease` **with** keystore | `app-release.apk`; `applicationId` / namespace `com.ledgr.app` | |
| E4 | Install APK; smoke A1–A7 offline | Same as airplane matrix on release binary | |

**Sign-off:** pending — blocked until operator builds on their machine/device.

---

## Related docs

- `README.md` — debug/release, privacy, backup overview
- `PROGRESS.md` — Stage 5 / Phase 12 / Wave 3 status
- `FINISH_PLAN.md` — F3.x checkboxes
- `USER_TASKS.md` — U24
