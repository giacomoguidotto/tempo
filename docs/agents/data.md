# Data

## Database — Drizzle + expo-sqlite

Rhythm configs and beat logs are stored in SQLite via Drizzle ORM. Setup in `src/lib/db.ts`.

Schemas are defined with Drizzle's schema builder in the feature that owns the table. Migrations managed by `drizzle-kit`.

## Preferences — MMKV

Fast key-value store for user preferences (e.g. onboarding state). Setup in `src/lib/storage.ts`. Not for structured/queryable data — use SQLite for that.

## UI State — Jotai

Atoms live in `src/features/[feature]/store/`. Derived atoms wrap DB query results for reactivity. Keep atoms minimal — prefer derived atoms over duplicating state.

## Validation — Zod

Schemas colocated in `src/features/[feature]/schemas.ts`. Export both the Zod schema and the inferred TypeScript type:

```ts
export const rhythmSchema = z.object({ ... });
export type Rhythm = z.infer<typeof rhythmSchema>;
```

Validate at boundaries (user input, DB reads). Trust internal code.
