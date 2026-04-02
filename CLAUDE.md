# Tempo

Repeating alarm & productivity time-audit app for Android, built with Expo.

## Quickstart

- **Package manager:** Bun (`bun install`, not npm)
- **Runtime setup:** `mise install` (node, bun, java 17)
- **Dev:** `cd app && bun start`
- **Android build:** `cd app && bun run android`
- **Lint:** `bun run lint` — **Format:** `bun run format`
- **Typecheck:** `bun run typecheck` — **Test:** `bun run test`

## Structure

- `app/` — Expo mobile app (Bun workspace)
  - `src/app/` — Expo Router file-based routes
  - `src/features/` — domain modules (rhythm, beat)
  - `src/components/ui/` — design system primitives
  - `src/lib/` — database, storage, utilities
  - `src/constants/` — brand tokens, config
- `site/` — placeholder for future marketing site

## Agent guidelines

- [Conventions](docs/agents/conventions.md) — commits, naming, feature folders
- [Frontend](docs/agents/frontend.md) — NativeWind, theme, components, animations
- [Data](docs/agents/data.md) — Drizzle, MMKV, Jotai, Zod
- [Alarms](docs/agents/alarms.md) — Notifee, intensity levels, permissions
