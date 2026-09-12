# DESIGN-AUDIT

> **Update:** The warm-ledger overhaul was reverted at user request. Visual system is again **cool mist + deep ledger teal** (gradients, HeroCards, denser card rows, category donut). This file remains as a historical audit of that experiment; do not treat Phase 4/5 “fixed” as current product UI.

---

**Platform note:** Ledgr is React Native (phone-first). “375 / 1440 screenshots” and “shadcn/ui” from the brief map to phone light/dark review + restyled design primitives. No web viewport matrix.

---

## Phase 2 — Initial audit (pre-fix inventory)

### Cross-cutting

| Area | Finding |
|------|---------|
| Color | Cool teal mist + gradient heroes (`colors.ts`, `HeroCard`, `ScreenBackdrop`) — violate warm near-neutral / no-gradient standard |
| Accent | Teal used widely; often >3 hits/screen |
| Charts | Donut + multi-color series (`AnalyticsBreakdownSection.tsx:84`) |
| Lists | Card rows with radius/shadow (`TransactionRowContent`, Trash) |
| Money | Income often missing `+` / signed |
| Destructive | Soft-delete often behind `Alert` despite undo banner |
| Empty | Decorative `EmptyIllustration` blobs |
| Add path | FAB only on Home; Activity empty-only |

Full per-screen DEFECTS / ELEVATION / jobs: see conversation audit (Home, Activity, Add, Insights, More*, SMS*, Budgets, Recurring, Subscriptions, Onboarding, AppLock).

---

## Phase 3 — UX flow changes (specified → implemented)

| Flow | Change | Why |
|------|--------|-----|
| Soft-delete (Activity, Add) | Soft-delete immediately + undo banner; drop confirm Alert | Destructive must be reversible without modal chains |
| SMS reject from Add | `skipConfirm` path rejects + undo | Same |
| Add expense defaults | Today’s date already; **last-used category** for type; smart note→category still overrides until user locks | Fewer taps |
| Empty states | Left-aligned teach + CTA; quiet icon mark | Not “no data” / not decoration |
| Activity add | **FAB** on Activity list | Add without leaving tab |
| Errors | Keep actionable retry/close copy via `ErrorState` | State what to do next |

Still intentionally confirming: backup restore, permanent trash purge, language restart (irreversible / system).

---

## Phase 4 — Fixes applied (by screen job)

### Tokens / primitives
- Warm stone neutrals, ink-blue accent `#1D4ED8` / `#3B82F6`, semantic expense/income/warning, 10-hue category palette, chart neutrals — `src/design/tokens/colors.ts`
- Radii tightened; motion ≤200ms; elevation shadows only for floating layers
- `ScreenBackdrop` flat; `HeroCard` flat ink (no gradient); `Card` border-only
- EGP rules: `tokens/currency.ts` + AR `ج.م` in `formatMoney`
- Skill written: `.cursor/skills/design-system/SKILL.md`

### Home — job: “How much did I spend this period?”
- Period chips → large signed spend → supporting streak/budgets link
- Removed brand title block and gradient spend card
- Dense recent rows via shared ledger row

### Activity — job: dense ledger of txs
- Hairline rows, 56pt height, signed amounts, no type icon wells
- FAB for add; undo delete without confirm
- Quiet empty illustration

### Add — job: amount → save fast
- Amount as left-aligned signed hero (not centered gradient)
- Last-used category + smart suggest
- Soft-delete → undo

### Insights — job: period net + where spend went
- Net first; I/E as signed rows (no KPI chip grid)
- Category **ranked share bars** (donut removed); top series emphasized in neutral gray
- Charts default to `chart.neutral*`
- Drill-down: ledger rows, loading/error, tap → edit

### SMS review — job: confirm amount
- Flat amount-first hero; signed income/expense

### Subscriptions — job: monthly cost
- One monthly hero amount; yearly as secondary line (no dual KPI card)

### Trash — job: restore or purge
- Flat rows; signed amounts

### Empty / keypad / sheets
- EmptyState left-aligned; EmptyIllustration quiet; keypad no shadow; sheets keep elevation (floating)

---

## Phase 5 — Re-audit (post-fix)

### Template smell check

| Screen | Still template? | Action |
|--------|-----------------|--------|
| Home | No — amount-led ledger landing | Keep; optional further demote SMS/accounts promos later |
| Activity | No — table rows | Keep |
| Add | No — amount-first | Keep |
| Insights | Mostly no — net + ranked bars | Patterns toggle still long; acceptable secondary |
| More hub | Settings list — OK for hub | No change |
| Month share HTML | Still may use decorative HTML colors | Out of RN UI; follow-up if sharing is product-critical |
| Onboarding | Still step cards | Acceptable for first-run; not daily UI |

### Remaining known gaps (non-blocking)
1. Some More forms still use Alert for validation (OK) and archive confirms without undo
2. Category drag may still use native elevation while dragging
3. Budget / recurring list rows still somewhat card-like — densify in a follow-up if needed
4. Physical device screenshots at 375 light/dark — verify on emulator after Metro reload (RN, not 1440 web)

### Grayscale / accent / banned checklist (code-level)
- [x] No gradients in RN chrome (`ScreenBackdrop`, `HeroCard`)
- [x] No category donut as primary visual
- [x] Income/expense use hue **and** `+`/`−` on primary money UIs
- [x] Charts neutral by default
- [x] Accent reserved for actions/nav/focus (FAB, selected chips, focus border)
- [x] No emoji UI
- [x] Tokens only in new/changed surfaces (legacy stored category hex may still appear in DB until recolored via palette helper)

---

## What changed and why (summary)

Repositioned Ledgr from “cool teal dashboard with gradient heroes and donuts” to a **warm near-neutral ledger**: numbers first, borders over shadows, signed money columns, ranked bars instead of rainbow pies, and undo instead of delete confirms. Every primary screen was redesigned from a one-sentence job, not patched with more cards.
