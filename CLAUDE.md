# Ledgr Engineering Guide

Build Ledgr as a typed, maintainable, offline-first React Native
personal finance app. No backend, no telemetry, no speculative cloud features.

## Structure

- `src/app`: startup, providers, navigation, root composition.
- `src/features/<feature>`: product code with `screens/`, `components/`,
  `hooks/` (and colocated domain helpers when feature-local).
- `src/design`: tokens, theme, primitives, motion, icons.
- `src/domain`: pure money / period / SMS / budget logic (no React, no DB).
- `src/db`: SQLite connection, migrations, repositories, seed.
- `src/lib`: small shared utilities (prefs, haptics, ids, notifications).
- `src/store`: Zustand UI stores (period, search, SMS review queue).
- `src/native`: thin JS bridges to native modules.
- `src/i18n`: locales (`en` / `ar`), layout direction, restart-on-RTL.

Keep screen files thin: one screen per file, presentational pieces in
`components/`, data and handlers in `hooks/`. See
`.cursor/rules/screen-composition.mdc` and `react-native-architecture.mdc`.

Add routes only when they complete a requested product flow.

## UI

- Use `useTheme()` and design primitives (`Text`, `Button`, `Input`, `Amount`,
  `Card`, `Sheet`, `Icon`, etc.).
- Never set `lineHeight`; rely on the platform default.
- Consume theme tokens only — no raw hex or magic spacing in feature files
  (seed/category colors in `src/db/seed.ts` are the exception).
- Keep feature-specific components local until they are genuinely reused.
- User-facing copy lives in `src/i18n/locales/` (English + Arabic). Prefer
  `useTranslation()` / `i18n.t(...)`. Switching EN↔AR that changes layout
  direction restarts the app so RTL/LTR apply correctly.

## State and data

- Prefer local state. Zustand persists UI prefs (period, last tab) via MMKV.
- All durable data goes through SQLite repositories — no fake APIs.
- SMS stays on-device; never upload message bodies.

## Quality

- Avoid `any`, unsafe casts, dead code, and hidden side effects.
- Add behavioral tests for domain logic and regressions.
- Run `npm run verify` after substantive changes.
- **Local-only git:** never commit or push (see
  `.cursor/rules/local-only-git.mdc`).

The scoped rules in `.cursor/rules/` are authoritative for their files.
