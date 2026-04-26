# Contributing

Thanks for wanting to contribute to Tempo! Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

## Setup

1. Fork and clone the repo, then install runtimes and dependencies:

    ```sh
    mise install        # node, bun, java 17
    bun install
    ```

2. Start the Expo dev server:

    ```sh
    cd app && bun start
    ```

3. Before pushing, run the full CI check locally:

    ```sh
    bun run ci
    ```

    This runs lint, typecheck, and test — the same pipeline as CI.

## Tooling

- **Runtime / package manager**: [Bun](https://bun.sh)
- **Monorepo**: [Turbo](https://turbo.build) with Bun workspaces
- **Linting & formatting**: [Biome](https://biomejs.dev) — not ESLint or Prettier
- **Tests**: [Vitest](https://vitest.dev) (unit, co-located `*.test.ts`)
- **Database**: [Drizzle](https://orm.drizzle.team) + expo-sqlite
- **Alarms**: [Notifee](https://notifee.app) — exact alarms, foreground services, full-screen intents

## Good to know

- **Android only** — there is no iOS target. No Xcode or macOS required.
- **Releases are gated on `app/` changes** — a `feat:` commit that only touches `site/` or `docs/` won't trigger a release. Releases only happen when `app/` has changes since the last tag.
- **Root vs workspace** — `bun run ci` (lint, typecheck, test) runs from the repo root via Turbo across all workspaces. The dev server requires `cd app && bun start`.

## Conventions

- Branch names: `feat/`, `fix/`, `docs/`, etc.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)
- `fix:` and `feat:` trigger an automatic release (patch/minor) — only use when the change genuinely warrants one
- `feat!:` / `BREAKING CHANGE` triggers a major release — never use without maintainer approval
- Components: PascalCase — Utilities/hooks: camelCase — Constants: SCREAMING_SNAKE_CASE
- All UI must use design system primitives from `src/components/ui/`
- New features live in `src/features/<name>/` with colocated components, state, schemas, and tests
- Use Zod for validation
