# FINISH PLAN — Ledgr private release

Senior eng + senior UI/UX backlog to close the product. Work top → bottom.  
Gate every code change with `npm run verify`. **Do not commit/push.**

Status: `[ ]` todo · `[~]` doing · `[x]` done · `[!]` blocked (needs device/operator)

---

## Wave 0 — Truth & hygiene (docs match reality)

- [x] **F0.1** Sync `TASKS.md` checkboxes that are already shipped (T4.5 receipts, T5.3 tags, Phase 12 FlashList note)
- [x] **F0.2** Update `PROGRESS.md` Phase 12 for FlashList + PAGE_SIZE=50 + freezeOnBlur
- [x] **F0.3** Refresh `USER_TASKS.md` agent notes with this finish plan priority

---

## Wave 1 — Must-ship product gaps

- [x] **F1.1 / U11 — Reject SMS transaction**  
  From Activity (SMS-sourced row): reject/soft-delete + optional “ignore similar” (sender/pattern).  
  AC: one tap from list/swipe or overflow; Ignore-similar reduces future auto-track for that fingerprint; EN/AR; undo still works for delete.
- [x] **F1.2 / U21 — Category drag reorder**  
  Replace or augment up/down with long-press drag reorder among siblings.  
  AC: works EN/AR + RTL; persists `sort_order`; a11y still has move up/down or announced alternatives.
- [x] **F1.3 — i18n debt sweep**  
  Kill hardcoded English (e.g. SMS Rules screen “Add rule” / empty copy). Audit `src/features/**` for raw user-facing strings.  
  AC: no user-visible English literals outside locales; AR keys present.

---

## Wave 2 — UI/UX consistency (studio bar)

- [x] **F2.1 — Screen scaffold audit**  
  Every list/settings screen: `ScreenBackdrop` / `ScreenScaffold`, consistent headers, refresh, empty/error/loading.  
  AC: no bare gray `View` shells on primary flows; rubric ≥4 hierarchy/spacing.
- [x] **F2.2 — List density & separators**  
  FlashList screens: consistent row gaps (no broken `gap` reliance), stable separators, no clipped swipe.  
  AC: Home / Activity / SMS / Budgets / More lists feel same family.
- [x] **F2.3 — Navigation choreography**  
  Validate fade stacks + tab freeze; modal Add feels intentional; back gesture safe; no double-mount thrash.  
  AC: tab switches stay snappy with 1k+ txs seeded; no blank flash.
- [x] **F2.4 — Add / SMS review microcopy & hierarchy**  
  Keypad-first path clarity; SMS popup hierarchy (amount → category → CTA); secondary actions demoted.  
  AC: common expense <5s; review trackable without scrolling on mid phones.  
  _Note: light touch only (tokens + touch targets on SMS review); no redesign._
- [x] **F2.5 — Accessibility pass**  
  Touch ≥44pt, labels on icon-only controls, TalkBack/VoiceOver on FAB, swipe, bulk bar, lock screen.  
  AC: critical flows operable with screen reader; contrast OK in dark.  
  _Leftover: full device TalkBack/VoiceOver matrix still operator `[!]` — easy wins shipped (filters, SMS chips, lock chrome)._

---

## Wave 3 — Trust, edge cases, release hardening

- [x] **F3.1 — Money / transfer / FX regression checklist**  
  Scripted Jest + manual notes: transfer edit legs, missing FX block, SMS USD→base.  
  AC: documented in PROGRESS + `DEVICE_MATRIX.md` §B; existing tests cover paths.
- [x] **F3.2 — Backup / restore / receipts smoke**  
  Export → wipe → restore with receipts; CSV preview path.  
  AC: checklist in `DEVICE_MATRIX.md` §C (+ PROGRESS); Jest covers export/restore/receipts.
- [!] **F3.3 / U24 — Airplane-mode device matrix**  
  Document operator steps + expected results (add tx, budgets, analytics, backup share, SMS with prior permission).  
  AC: checklist file ready (`DEVICE_MATRIX.md` §A); **physical device run still blocked**.
- [x] **F3.4 — Cold-start / 5k–10k seed perf note**  
  Dev seed path + expected list scroll; optional timing log.  
  AC: PROGRESS Phase 12 + `DEVICE_MATRIX.md` §D updated; device timing remains optional `[!]`.
- [!] **F3.5 — Release readiness**  
  Confirm release signing fail-closed, ProGuard keeps, package `com.ledgr.app`, privacy copy.  
  AC: README release section matches fail-closed Gradle; docs verified. **APK assemble remains operator `[!]`**.

---

## Wave 4 — Delight polish (only after Waves 1–3)

- [x] **F4.1 — Empty states last pass** after demo clear / first launch
- [x] **F4.2 — Motion audit** (reduce-motion = 0ms everywhere meaningful)
- [x] **F4.3 — Final DESIGN.md rubric scores** for Home, Activity, Add, SMS, Insights, More (light+dark)

---

## Explicitly deferred (do not block finish)

- Native PDF month-in-review (HTML share shipped)
- Android home-screen App Widget (Notifee action shipped)
- Package-id migration bridges

---

## Execution rule

Pick the first unchecked non-`[!]` item. Implement. `npm run verify`. Update this file + `USER_TASKS.md` / `PROGRESS.md`. Continue until only `[!]` device/operator items remain.
