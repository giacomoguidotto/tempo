# Contributing

Thanks for your interest in Tempo!

## Setup

```bash
git clone https://github.com/giacomoguidotto/tempo.git
cd tempo
mise install        # node, bun, java 17
bun install
```

## Development

| Command                     | Description                             |
| --------------------------- | --------------------------------------- |
| `cd app && bun start`       | Expo dev server                         |
| `cd app && bun run android` | Build and run on device                 |
| `bun run lint`              | Check formatting and lint rules (Biome) |
| `bun run format`            | Auto-fix formatting                     |
| `bun run typecheck`         | TypeScript strict mode                  |
| `bun run test`              | Run unit tests (Vitest)                 |

## Architecture

Tempo is a monorepo managed with [Turbo](https://turbo.build) and [Bun](https://bun.sh) workspaces.

```
tempo/
├── app/                 # Expo mobile app
│   ├── src/
│   │   ├── app/         # Expo Router file-based routes
│   │   ├── features/
│   │   │   ├── rhythm/  # Rhythm CRUD, schemas, presets, VU meter
│   │   │   └── beat/    # Alarm engine: scheduling, permissions, channels
│   │   ├── components/
│   │   │   └── ui/      # Design system primitives
│   │   ├── lib/         # Database, storage, utilities
│   │   └── constants/   # Brand tokens, config
│   ├── assets/          # App icon, splash screen
│   └── plugins/         # Custom Expo config plugins
├── site/                # Next.js marketing site
├── docs/                # Play Store listing, agent guidelines
└── .github/workflows/   # CI/CD: lint, typecheck, test, release, EAS build
```

Each domain lives in `src/features/<name>/` with colocated components, state, schemas, and tests.

## Tech Stack

| Layer             | Tools                                                           |
| ----------------- | --------------------------------------------------------------- |
| **Framework**     | Expo SDK 55, React Native 0.83, React 19                        |
| **Routing**       | Expo Router (file-based)                                        |
| **Styling**       | NativeWind v4 + Tailwind CSS v4                                 |
| **Animations**    | Reanimated 4, Gesture Handler 2                                 |
| **State**         | Jotai (UI), MMKV (preferences), Drizzle + expo-sqlite (data)    |
| **Validation**    | Zod                                                             |
| **Alarms**        | Notifee: exact alarms, foreground services, full-screen intents |
| **Fonts**         | Fraunces (display), IBM Plex Mono (mono)                        |
| **Monorepo**      | Turbo, Bun workspaces                                           |
| **Lint & Format** | Biome                                                           |
| **CI/CD**         | GitHub Actions, semantic-release, EAS Build, Play Store         |

## Commits

The project uses [conventional commits](https://www.conventionalcommits.org/) enforced by commitlint and Husky.

Releases are automated with semantic-release:

| Prefix                                  | Release       |
| --------------------------------------- | ------------- |
| `fix:`                                  | Patch (0.0.x) |
| `feat:`                                 | Minor (0.x.0) |
| `BREAKING CHANGE`                       | Major (x.0.0) |
| `chore:`, `docs:`, `test:`, `refactor:` | No release    |

## Before Pushing

```bash
bun run lint && bun run typecheck && bun run test
```

All three run automatically in CI on every pull request.
