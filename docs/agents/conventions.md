# Conventions

## Commits

Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

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
