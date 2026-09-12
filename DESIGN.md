# DESIGN

Design system source of truth. See also `.cursor/skills/design-system/SKILL.md`.

## Intent

A personal daily driver: cool mist neutrals, one deep ledger teal accent, numbers as the hero. Soft elevation and atmospheric washes — calm premium, not a dashboard.

## Direction (locked — teal mist)

| Token area | Direction |
|---|---|
| Neutrals | Cool mist (`#F1F5F6` / `#070D0F`) — not warm stone |
| Accent | Deep ledger teal `#0C7A75` light / `#2DB5AF` dark |
| Hero | Teal gradient (`hero.from` → `mid` → `to`) on money focal panels |
| Semantic | Distinct shapes/icons + hue for income/expense |
| Charts | Teal series via `chart.series1…6` |
| Type | Platform sans; tabular amounts; **never set `lineHeight`** |
| Spacing | 4pt grid |
| Radii | 10 / 14 / 20 / 28 |
| Motion | ≤300ms; reduce-motion → 0 |
| Elevation | Soft `#0A1619` shadows on cards; stronger for sheets |

## Banned

KPI tile grids · purple/indigo gradients · neon/glow glass · emoji UI · warm cream newspaper look

## Token entry

`src/design/tokens/` — color, space, type, radii, motion, elevation. Consume via `useTheme()`.

## EGP

Integer minor units; always 2 fraction digits; `E£` prefix (EN) / `ج.م` suffix (AR); Unicode minus `−` when signed.

## Polish log

### Restore 2026-09-12

Reverted warm near-neutral overhaul back to cool mist + deep ledger teal: HeroCard gradients, ScreenBackdrop wash, elevated cards, donut breakdown, amount heroes on Home/Add/SMS/Insights.

### Polish loop 2026-09-12

- Dark borders/tertiary contrast raised for AA
- Signed `+/−` on Activity, Insights chips, month review, Home spend, Trash, Subscriptions, Recurring
- ScreenEnter / FAB / progress bar motion wired to `ThemeProvider.duration` (reduce-motion → 0)
- SMS Rules + Subscriptions: loading skeletons, errors, elevated rows, empty CTAs
- Budgets rows elevated; Trash/SMS Inbox empty chrome; chart axis sizes tokenized
- A11y: period control label, streak chip, bulk bar toolbar label
