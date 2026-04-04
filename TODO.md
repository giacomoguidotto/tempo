# Tempo — "Find your rhythm"

A repeating alarm & productivity time-audit tool for Android.

## Decisions Log

### Product
- **Core concept:** Repeating alarm/timer that doubles as a productivity micro-journal
- **Target platform:** Android-only (architecture abstracted for future iOS)
- **Data:** Local-first (expo-sqlite for structured data, MMKV for settings)
- **Identity:** "Tempo" — subtle musical metaphor, clean and minimal
- **Tagline:** "Find your rhythm" / "Conduct your day"

### Architecture
- **Monorepo:** Bun workspaces + Turborepo
- **Structure:** `app/` (Expo), `site/` (Next.js marketing), `pkgs/` (shared config)
- **Feature folders with platform adapters** (business logic decoupled from platform)
- **No backend, no auth, no cloud sync** (v0/v1)

### Tech Stack — Mobile App (`app/`)
- Expo SDK (latest) with development build
- Expo Router (file-based navigation)
- NativeWind (Tailwind for React Native)
- Reanimated + Moti (animations)
- Jotai (UI state)
- Zod (validation)
- expo-sqlite (time logs, alarm configs)
- MMKV (user preferences/settings)
- lucide-react-native (icons)

### Tech Stack — Marketing Site (`site/`)
- Next.js (latest) with App Router
- Blueprint patterns (Tailwind, Biome, TypeScript strict)
- Deployed to Vercel at tempo.guidotto.dev

### DX Tooling (from Blueprint)
- Bun (package manager + scripts)
- Biome + Ultracite (linting/formatting)
- Husky (pre-commit hooks)
- TypeScript strict mode
- Vitest (unit tests)
- Maestro (mobile E2E tests, replaces Playwright)
- Renovate (dependency management, single root config)
- GitHub Actions CI (lint, typecheck, test, build)

### Alert Intensity Levels
| Level      | Name      | Vibration    | Sound            | Full-screen | Notification   |
|------------|-----------|--------------|------------------|-------------|----------------|
| **Gentle** | *Whisper* | Short pulse  | No               | No          | Yes (silent)   |
| **Medium** | *Nudge*   | Short pulse  | Short sound      | No          | Yes            |
| **Strong** | *Pulse*   | Short pulse  | Short sound      | Yes         | Yes            |
| **Urgent** | *Call*    | Long vibrate | Persistent sound | Yes         | Yes            |

All levels respect system sound mode (silent/vibrate/ring). Default intensity configurable in settings.

### Musical Naming Convention
- **Rhythm** = a configured alarm schedule
- **Beat** = a single alarm firing
- **Note** = an activity log entry at a beat
- **Measure** = the time range (e.g., 09:00–21:00)
- **Score** = the daily/weekly review

---

## Roadmap

### v0 — Replace the ugly app
> Goal: A beautiful, ad-free alarm app that reliably fires repeating alarms.
> You still log in your spreadsheet. But the alarm works perfectly.

- [x] **Project bootstrap**
  - [x] Initialize monorepo (Bun workspaces + Turborepo)
  - [x] Scaffold Expo app in `app/`
  - [x] Scaffold Next.js marketing site in `site/` (placeholder .gitkeep)
  - [ ] Create `pkgs/config` (shared biome, tsconfig base, brand tokens) — deferred, flat monorepo for now
  - [x] Configure Biome + Ultracite at root
  - [x] Configure Husky pre-commit hook
  - [x] Configure Renovate
  - [x] Configure GitHub Actions CI
  - [x] Set up turbo.json pipelines (lint, typecheck, test, build)
  - [x] Initialize git repo + first commit

- [x] **Core alarm engine**
  - [x] Define alarm config schema (Zod): name, days, time range, interval, intensity
  - [x] Android adapter: Notifee TimestampTrigger + AlarmManager for reliable delivery
  - [x] Background execution — alarms fire when app is backgrounded/killed
  - [x] Notification channel setup (4 channels per intensity level)
  - [ ] Persistent notification showing active rhythm status
  - [ ] Platform adapter interface for alarm scheduling (deferred — Android-only for v0)

- [x] **Alert system**
  - [x] Implement 4 intensity levels (Whisper / Nudge / Pulse / Call)
  - [x] Vibration patterns per level
  - [x] Sound playback per level (respecting system sound mode)
  - [x] Full-screen alert activity for Pulse and Call levels
  - [x] Dismiss actions on notifications
  - [ ] Snooze actions on notifications — deferred to v1

- [x] **Data layer**
  - [x] MMKV setup for user preferences
  - [x] expo-sqlite setup for rhythm storage (Drizzle ORM)
  - [x] CRUD operations for rhythms (create, read, update, delete, toggle, reorder)

- [x] **UI — Home screen**
  - [x] List of saved rhythms with on/off toggle
  - [x] Active rhythm status (next beat countdown, live-updating every minute)
  - [x] FAB to create new rhythm
  - [x] Empty state for first-time users (hero hidden, centered message)
  - [x] Swipe-to-delete with animated collapse
  - [x] Long-press drag to reorder
  - [x] Progress bar with proportional ticks + in-progress gradient
  - [x] VU meter hero animation (conveyor belt, frame-driven, decelerate/accelerate)

- [x] **UI — Create/Edit rhythm screen**
  - [x] Name input (pre-filled with random preset)
  - [x] Day selector (S M T W T F S, justified)
  - [x] Time range picker (dual-handle slider + tappable time labels → wheel picker modal)
  - [x] Interval selector (preset chips + tappable label → wheel picker modal)
  - [x] Intensity picker (Whisper / Nudge / Pulse / Call) with descriptions
  - [ ] Preview: list of upcoming beats — deferred
  - [x] Save / delete actions
  - [x] Bottom sheet drawer with swipe-to-dismiss (locked when dirty)
  - [x] Unsaved changes confirmation dialog (branded)
  - [x] Random presets for new rhythm inspiration

- [ ] **UI — Settings screen** — deferred (theme is system-controlled)
  - [ ] Default intensity level
  - [ ] Theme (dark/light/system)
  - [ ] About / version info

- [x] **UI — Design system**
  - [x] NativeWind v5 setup + Warm Analog brand color tokens (dark + light)
  - [x] Typography: Fraunces (display) + IBM Plex Mono (mono)
  - [x] Core components (RangeSlider, Slider, WheelPicker, ConfirmDialog, RhythmCard)
  - [x] Signature animation (VU meter with color shift + deceleration)
  - [ ] App icon + splash screen — placeholder PNGs, custom icon pending

- [x] **Permissions**
  - [x] SCHEDULE_EXACT_ALARM (Android 12+)
  - [x] POST_NOTIFICATIONS (Android 13+)
  - [x] FOREGROUND_SERVICE
  - [x] WAKE_LOCK
  - [ ] REQUEST_IGNORE_BATTERY_OPTIMIZATIONS — removed (opens system settings on every toggle on emulator)
  - [x] USE_FULL_SCREEN_INTENT (for Pulse/Call levels)
  - [x] Permission request flow (on first toggle/create, only when not granted)

- [ ] **Testing**
  - [ ] Unit tests for alarm scheduling logic (pure functions)
  - [ ] Unit tests for Zod schemas
  - [ ] Unit tests for CRUD operations
  - [ ] Manual testing checklist for alarm reliability

### v1 — Capture built in
> Goal: When a beat fires, you can log your activity right there. No more spreadsheet.

- [ ] **Quick capture flow**
  - [ ] Notification action: quick-reply text input for activity note
  - [ ] Alternatively: tapping notification opens minimal bottom sheet
  - [ ] Auto-populate timestamp from the beat
  - [ ] Activity suggestions / autocomplete from history
  - [ ] Ability to skip / mark as "away"

- [ ] **Note storage**
  - [ ] expo-sqlite table for notes (timestamp, rhythm_id, text, category)
  - [ ] Link notes to their beat/rhythm

- [ ] **Today view**
  - [ ] Timeline of today's beats with logged notes
  - [ ] Visual indicator for missed/skipped beats
  - [ ] Edit past notes

- [ ] **System integration**
  - [ ] Floating window (PiP) showing current countdown (SYSTEM_ALERT_WINDOW)
  - [ ] Dynamic Island / Live Activity (Android 15+, progressive enhancement)
  - [ ] Lock screen controls (pause/dismiss)

- [ ] **E2E testing**
  - [ ] Maestro setup
  - [ ] Test: create rhythm → wait for beat → capture note → verify in today view

### v2 — Review & insights
> Goal: Replace the spreadsheet entirely. See where your time goes.

- [ ] **Weekly table view**
  - [ ] Grid layout matching the spreadsheet (time slots × days)
  - [ ] Color-coded by activity category
  - [ ] Tap to edit any cell

- [ ] **Activity categories**
  - [ ] Auto-categorize based on note text (ML or keyword matching)
  - [ ] Manual category assignment
  - [ ] Custom categories with colors

- [ ] **Charts & analytics**
  - [ ] Daily breakdown (pie/donut chart by category)
  - [ ] Weekly trends (stacked bar chart)
  - [ ] Time comparison across weeks
  - [ ] "Productivity score" based on self-defined goals

- [ ] **Export**
  - [ ] CSV export (matching current spreadsheet format)
  - [ ] Share as image (daily/weekly summary card)

- [ ] **History**
  - [ ] Browse past days/weeks
  - [ ] Search notes

### Future ideas (unscoped)
- [ ] iOS support (implement iOS adapters)
- [ ] i18n (English + Italian, following Blueprint's next-intl pattern)
- [ ] Interval timer mode (work/break phases, Pomodoro-style)
- [ ] Chain timer mode (sequence of different durations)
- [ ] Stopwatch with lap alerts
- [ ] Escalating intervals (each repeat longer/shorter)
- [ ] Custom alarm sounds (pick from device audio)
- [ ] Gradual volume increase
- [ ] Voice announcement (TTS: "break time", "15 minutes elapsed")
- [ ] Home screen widget (quick-start a preset with one tap)
- [ ] Wear OS companion app
- [ ] Cloud sync (optional, for multi-device)
- [ ] Web dashboard for reviewing time logs on desktop
- [ ] Marketing site at tempo.guidotto.dev
- [ ] Play Store listing

---

## Project Structure

```
tempo/
├── app/                          # Expo mobile app
│   ├── src/
│   │   ├── app/                  # Expo Router (file-based routes)
│   │   ├── features/
│   │   │   ├── rhythm/           # Alarm configuration & management
│   │   │   │   ├── components/
│   │   │   │   ├── store/        # Jotai atoms
│   │   │   │   ├── schemas.ts    # Zod schemas
│   │   │   │   ├── types.ts
│   │   │   │   └── adapters/
│   │   │   │       └── android.ts
│   │   │   ├── beat/             # Alarm firing & notification
│   │   │   │   ├── components/
│   │   │   │   └── adapters/
│   │   │   │       └── android.ts
│   │   │   └── note/             # Activity logging (v1)
│   │   │       ├── components/
│   │   │       ├── store/
│   │   │       └── schemas.ts
│   │   ├── components/           # Shared UI components
│   │   │   └── ui/               # Design system primitives
│   │   ├── lib/                  # Utilities
│   │   │   ├── db.ts             # expo-sqlite setup
│   │   │   ├── storage.ts        # MMKV setup
│   │   │   └── utils.ts
│   │   └── constants/            # Brand tokens, config
│   ├── assets/                   # Icons, splash, sounds
│   ├── app.json                  # Expo config
│   ├── package.json
│   └── tsconfig.json
├── site/                         # Next.js marketing site
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── pkgs/
│   └── config/                   # Shared configuration
│       ├── biome.json            # Base biome config
│       ├── tsconfig.base.json    # Base TypeScript config
│       └── brand.ts              # Colors, fonts, tokens
├── turbo.json
├── package.json                  # Workspace root
├── biome.json                    # Root biome (extends pkgs/config)
├── renovate.json
├── .husky/
├── .github/workflows/ci.yml
├── TODO.md
└── CLAUDE.md
```
