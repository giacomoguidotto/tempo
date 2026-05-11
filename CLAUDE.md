# Tempo

Repeating alarm & productivity time-audit app for Android, built with Expo.

Run `eval "$(mise activate zsh)"` if the toolchain is not on PATH. Use Bun, not npm.

Verify code quality with `bun run lint` and `bun run typecheck`.

## Collaboration

Jack tests on-device after each change — feedback comes as annotated screenshots. If something "feels off," treat it as a bug. Expect multiple passes per feature: ship the simplest version, let Jack react, then refine.

## Commits

Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). See [conventions](docs/agents/conventions.md) for release-trigger details.

**Always ask before using `fix:` or `feat:`** — these trigger a release via semantic-release.

**Never** use `BREAKING CHANGE` or the `!` suffix — only with explicit user authorization.

## Docs

- [Conventions](docs/agents/conventions.md) — naming, feature folders, build gotchas, version pins
- [Frontend](docs/agents/frontend.md) — NativeWind, brand, design system
- [Data](docs/agents/data.md) — Drizzle, MMKV, Jotai, Zod
- [Alarms](docs/agents/alarms.md) — Notifee, intensity levels, permissions

## Agent skills

### Issue tracker

GitHub Issues on `giacomoguidotto/tempo`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (one `CONTEXT.md` + `docs/adr/` at the repo root). See `docs/agents/domain.md`.
