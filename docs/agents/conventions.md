# Conventions

## Commits

Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

### Release-triggering prefixes

Semantic-release creates a new version on `main` for these prefixes:
- `fix:` → patch (0.0.x)
- `feat:` → minor (0.x.0)
- `BREAKING CHANGE` / `!` suffix → major (x.0.0) — **never use without explicit user authorization**

Only use `fix:` and `feat:` when the change genuinely warrants a release. For internal changes (refactors, docs, tests, CI, config), use `chore:`, `docs:`, `refactor:`, or `test:` — these do not trigger a release.

## Feature folders

Each domain lives in `src/features/[feature]/` with collocated:
- `components/` — feature-specific UI
- `store/` — Jotai atoms
- `schemas.ts` — Zod schemas
- `adapters/` — platform-specific implementations (e.g. `android.ts`)

Shared UI goes in `src/components/ui/`. Cross-feature utilities go in `src/lib/`.

## Naming

- Components: `PascalCase` files and exports
- Utilities, hooks, atoms: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Tests: `*.test.ts` colocated with source
- Schemas: export both the schema (`rhythmSchema`) and inferred type (`Rhythm`)
