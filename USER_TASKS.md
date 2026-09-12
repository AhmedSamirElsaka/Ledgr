# USER TASKS — make it perfect

Tasks written as if I assigned them. Agent: pick the next unchecked item, implement, run `npm run verify`, exercise on device when possible, check it off. **Do not commit or push** (see `.cursor/rules/local-only-git.mdc`).

Status: `[ ]` todo · `[~]` doing · `[x]` done · `[!]` blocked (needs device/operator)

---

## Must-have gaps

- [x] **U1 — Tags on expenses**  
  I want to add/remove tags when adding or editing a transaction, manage tags under More, and filter the transactions list by tag.

- [x] **U2 — Real transaction filters**  
  Transactions screen needs filters for date range, account, category, type, amount range, and source (manual / SMS / etc.), plus clear-all. Search already exists — keep it.

- [x] **U3 — Multi-select + bulk actions**  
  Long-press to select many transactions; bulk recategorize, add tag, or delete (soft).

- [x] **U4 — Swipe actions**  
  Swipe a row to delete or edit quickly.

- [x] **U5 — Receipt photo**  
  Optional receipt image on add/edit, stored in app-private storage, preview + remove. Included in JSON backup as `receipt_files`.

- [x] **U6 — Trash**  
  Soft-deleted items live in More → Trash for 30 days; restore or permanently delete.

- [x] **U7 — Merchant aliases UI**  
  Edit “AMZN MKTP → Amazon” mappings under More; used by SMS cleanup.

- [x] **U8 — Recurring manual rules**  
  Define repeating expenses/income (not only subscriptions); generate on due date / app open with idempotent `source_ref`.

---

## SMS & import polish

- [x] **U9 — Custom import date range**  
  Besides 7/14/30/90/180 presets, let me pick From / To dates for SMS import.

- [x] **U10 — Import from Home**  
  One-tap “Import SMS” on Home (Android) that opens the import screen.

- [x] **U11 — Reject SMS transaction**  
  One tap from an SMS-marked transaction to reject/delete and optionally ignore similar next time.  
  _(Swipe/edit Reject + settings-backed ignore-similar patterns; review inbox Ignore unchanged.)_

- [x] **U12 — Confidence / matched rule visible**  
  On SMS-created txs and review rows, show which rule matched / confidence copy.

---

## Analytics & reports

- [x] **U13 — Finish missing charts**  
  Balance-over-time per account, budget adherence history, recurring vs one-off split, month-in-review shareable **on-device HTML** (native PDF / image still deferred).

- [x] **U14 — Analytics text summaries**  
  Every chart section has an accessible text summary (not only visuals).

---

## Daily-driver UX

- [x] **U-i18n — English / Arabic**  
  App UI bilingual (en/ar); copy in `src/i18n/locales/`; RTL language switch restarts the app.

- [x] **U15 — Pull-to-refresh everywhere it matters**  
  Home, Transactions, Analytics, Budgets — recompute from DB.

- [x] **U16 — Undo snackbar after delete**  
  Soft-delete shows undo for a few seconds (static banner).

- [x] **U17 — Duplicate transaction**  
  From edit/detail, duplicate as a starting point for a new entry.

- [x] **U18 — Quick amounts / templates**  
  Optional saved quick expenses (e.g. Coffee 40 EGP) on the add screen.

- [x] **U19 — Search in More / settings**  
  Jump to Accounts, SMS, Backup from a small search field on More.

- [x] **U20 — Empty states with the right next action**  
  Audit every empty screen so the primary CTA matches what I should do next (especially after clearing demo data).

---

## Polish & “all options”

- [x] **U21 — Category reorder by drag**  
  Long-press drag to change sort order.  
  _(RNGH long-press pan among siblings; move up/down kept for a11y; ScrollView on Categories.)_

- [x] **U22 — Archive accounts/categories from list**  
  Clear archive/unarchive without hunting in forms.

- [x] **U23 — Notification settings screen completeness**  
  Toggle daily reminder, subscription reminders, quiet hours (local only). Privacy copy: reminders stay on-device; lock-screen bodies prefer redaction by default.

- [!] **U24 — Airplane-mode smoke checklist**  
  Document + verify on a physical device: add tx, budgets, analytics, backup share file, SMS import with prior permission — no network required.  
  _(Checklist ready in `DEVICE_MATRIX.md` §A — operator steps + expected results. Physical verify / sign-off still blocked.)_

- [x] **U25 — Final design pass**  
  Harsh polish on Home, Add, Transactions, SMS import, Analytics after the features above land (scaffold unification + Insights/More pass).

---

## Agent notes

Priority for remaining gaps: follow **`FINISH_PLAN.md`** waves.  
Wave 2 UI consistency landed; next: **Wave 3** — **U24 / F3.3 physical device** + **F3.5 APK** still `[!]`.  
Stages 1–4 product work is shipped; Stage 5 hardening docs in `DEVICE_MATRIX.md`. App package stays **`com.ledgr.app` only**.
