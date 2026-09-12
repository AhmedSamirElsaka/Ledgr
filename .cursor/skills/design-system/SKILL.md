# Design system — Ledgr (expense tracker)

Source of truth for UI. Tokens live in `src/design/tokens/`. Feature code uses `theme.*` only — **never** literal hex, raw spacing, or ad-hoc radii.

## Point of view

This is a calm personal ledger with **cool mist** surfaces and a **deep ledger teal** accent. Numbers are the product. Soft elevation and atmospheric washes support hierarchy — not flat stone Minimalism.

## Banned

- Purple/indigo gradients, glassmorphism, neon, glow-for-its-own-sake
- Warm cream / stone “newspaper” neutrals
- Emoji as UI
- Uniform mega-radius + identical shadows on every surface
- Speculative dashboard chrome that outshines amounts

## Required

- One clear focal point; money amounts lead
- Hierarchy via type weight/size/color **and** restrained elevation
- Accent used deliberately: primary actions, active nav, hero panels
- Income vs expense: semantic color **plus** explicit `+`/`−` where signed
- Gradients allowed only for **HeroCard** and **ScreenBackdrop** atmospheric wash (token-driven)

## Color (cool mist + deep ledger teal)

### Light
| Role | Hex |
|------|-----|
| page | `#F1F5F6` |
| surface | `#FFFFFF` / raised `#F7FAFB` |
| border | `#D5E0E4` |
| text primary | `#0A1619` |
| text secondary | `#5B6B70` |
| accent | `#0C7A75` |

### Dark
| Role | Hex |
|------|-----|
| page | `#070D0F` |
| surface | `#0F1C1F` |
| border | cool ink rgba |
| text primary | `#E6F1F3` |
| text secondary | `#AFC0C6` |
| accent | `#2DB5AF` |

### Semantic
Expense / income / warning via `theme.colors.semantic.*` — always pair with sign/position.

### Hero
`theme.colors.hero.from|mid|to|text|muted|glow|chip` for money focal panels.

### Charts
`theme.colors.chart.series1…6` — teal-led series, not rainbow-by-default noise.

## Spacing

4px scale → `theme.space[n]`.

## Type

Platform UI sans. Variants: `label`, `caption`, `body`/`bodyStrong`, `headline`, `title`, `display`, `amountSm|Md|Lg`.  
**Never set `lineHeight`.** Amounts use `fontVariant: ['tabular-nums']`.

## Radii

`sm` 10 · `md` 14 · `lg` 20 · `xl` 28

## Motion

≤300ms (`fast` 120 / `normal` 200 / `slow` 280). Respect reduce-motion (`duration → 0`).

## Elevation

Soft shadows tinted `#0A1619`. Cards may use `elevated`; sheets/dialogs use higher levels.

## EGP currency formatting

- Minor units are integers; never float money in UI logic
- Always show **2** fraction digits for EGP
- Symbol `E£` prefix (EN); Arabic locale may use `ج.م` suffix via `formatMoney` locale
- Outflows: `−` (U+2212) when signed; inflows: `+` when signed

## Checklist before shipping a screen

1. Grayscale: income ≠ expense still readable?
2. Accent still meaningful (not everywhere)?
3. Loading = skeleton matching layout; empty teaches + CTA; error says next step
4. Destructive actions reversible (undo) or confirmed
5. WCAG AA text; primary amounts strong contrast
