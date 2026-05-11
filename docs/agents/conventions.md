# Conventions

## Release triggers

Semantic-release creates a new version on `main`:
- `fix:` → patch (0.0.x)
- `feat:` → minor (0.x.0)

Non-triggering prefixes for internal changes: `chore:`, `docs:`, `refactor:`, `test:`.

## Feature folders

Each domain lives in `src/features/[feature]/` with collocated:
- `components/` — feature-specific UI
- `store/` — Jotai atoms
- `schemas.ts` — Zod schemas
- `adapters/` — platform-specific implementations (e.g. `android.ts`)

Shared UI goes in `src/components/ui/`. Cross-feature utilities go in `src/lib/`.

## Schemas

Export both the Zod schema and the inferred type from `src/features/[feature]/schemas.ts`:
- Schema: `rhythmSchema` — Type: `Rhythm`

## Build gotchas

- **Bun hoisting:** Bun puts dependencies in `node_modules/.bun/` with hashed paths. Gradle's `require.resolve` and native module auto-linking often cannot find them. When a native build fails with "module not found," add the package as an explicit dependency in `app/package.json` so Bun creates a resolvable symlink.
- **Node 24 + CommonJS:** Tempo keeps `"type": "commonjs"` in `app/package.json` because Metro config, Expo config plugins, and related RN tooling expect CommonJS. Config files using `require()` are excluded from Biome.
- **Biome excludes:** `biome.json` intentionally excludes `global.css`, `app.json`, `metro.config.js`, `plugins/*.js`, and `app/index.js` from some or all formatting and linting.

## Version pins

Expo SDK 55 with React Native pinned to `0.83.4`. Reanimated `4.2.1` requires `react-native-worklets` ~`0.7.4` (not `0.8.x`). Gesture Handler must stay on `2.31+` for RN 0.83 compatibility.
