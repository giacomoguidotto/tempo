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
- `v0` focus: expose `Whisper`, `Nudge`, and `Pulse` only while stabilizing the urgent alarm flow.
- The current fourth level (`Call`) is deferred from the UI and should be reintroduced in `v1` under a new name.

### Alarm Reliability Guards
- **Hard guard** = a system condition Tempo requires in order to honestly promise the intended `Pulse` behavior.
- If a hard guard is missing or later revoked, Tempo should mark the rhythm as unhealthy and avoid arming `Pulse`. Do not silently downgrade intensity or disable the rhythm behind the user's back.
- **v0 hard guards for `Pulse`:** notification permission granted, exact alarm access granted, full-screen notification access granted where required, `Pulse` channel exists and is enabled, `Pulse` channel importance remains high.
- **Not hard guards in v0:** battery optimization, DND override, OEM background restrictions. These should be surfaced as reliability warnings, not blockers.

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
  - [x] Persistent notification showing active rhythm status

- [x] **Alert system**
  - [x] Implement 4 intensity levels (Whisper / Nudge / Pulse / Call)
  - [x] Vibration patterns per level
  - [x] Sound playback per level (respecting system sound mode)
  - [x] Full-screen alert activity for Pulse and Call levels
  - [x] Dismiss actions on notifications
  - [x] Older active alerts are superseded when a newer instance fires
  - [x] Remove `Call` from the v0 UI and stabilize `Pulse` as the only exposed full-screen level

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
  - [x] Intensity picker (Whisper / Nudge / Pulse) with descriptions
  - [x] Remove `Call` from the v0 intensity picker while the urgent fourth level is deferred
  - [x] Save / delete actions
  - [x] Bottom sheet drawer with swipe-to-dismiss (locked when dirty)
  - [x] Unsaved changes confirmation dialog (branded)
  - [x] Random presets for new rhythm inspiration

- [x] **UI — Design system**
  - [x] NativeWind v5 setup + Warm Analog brand color tokens (dark + light)
  - [x] Typography: Fraunces (display) + IBM Plex Mono (mono)
  - [x] Core components (RangeSlider, Slider, WheelPicker, ConfirmDialog, RhythmCard)
  - [x] Signature animation (VU meter with color shift + deceleration)
  - [x] App icon + splash screen wired with current branded assets

- [x] **Permissions**
  - [x] SCHEDULE_EXACT_ALARM (Android 12+)
  - [x] POST_NOTIFICATIONS (Android 13+)
  - [x] FOREGROUND_SERVICE
  - [x] WAKE_LOCK
  - [x] USE_FULL_SCREEN_INTENT (for Pulse/Call levels)
  - [x] Permission request flow (on first toggle/create, only when not granted)

- [ ] **Testing**
  - [x] Unit tests for alarm scheduling logic (pure functions)
  - [x] Unit tests for Zod schemas
  - [x] Unit tests for CRUD operations
  - [x] Manual testing checklist for alarm reliability
  - [ ] Run the alarm reliability checklist on a production build
  - [ ] Upload ProGuard/R8 mapping files with production builds for crash deobfuscation

### v1 — Capture built in
> Goal: When a beat fires, you can log your activity right there. No more spreadsheet.

- [ ] Reintroduce the fourth urgency level to the UI after `Pulse` is reliable
- [ ] Rename the current `Call` concept before reintroducing it in product copy, tokens, and UI

- [ ] **Alarm controls & reliability**
  - [ ] Snooze actions on notifications
  - [ ] Mark active alerts as `missed` after their timeout window
  - [ ] Preview: list of upcoming beats while editing a rhythm

- [ ] **Schedule & lifecycle**
  - [ ] Day presets in day selector (Workdays, Weekends, Every day)
  - [ ] Timeout timer — auto-stop rhythm after X days (naming TBD: "Expiry", "Sunset", "Coda")
  - [ ] Holiday disable — pause rhythms during user-defined date ranges

- [ ] **Beat customization**
  - [ ] Configurable beat duration (how long the alert vibrates/sounds/shows full-screen)
  - [ ] Per-rhythm duration override independent of intensity level

- [ ] **Settings**
  - [ ] Default intensity level
  - [ ] About / version info

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

- [ ] **Intensity customization**
  - [ ] Custom intensity level with granular controls (sound on/off + duration, vibration on/off + duration, full-screen on lock screen, full-screen over apps)
  - [ ] Rethink notification channel strategy for arbitrary custom configs
  - [ ] Sound playback analysis for long-duration alerts

- [ ] **Hero & engagement**
  - [ ] VuMeter animation synced to beat timing (countdown approach animation, beat-moment pulse)
  - [ ] Connect VU meter to beat engine's real-time schedule

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
- [ ] Shared `pkgs/config` workspace package once cross-project config reuse becomes worth it
- [ ] iOS support (implement iOS adapters)
- [ ] Extract a platform adapter interface for alarm scheduling when iOS support starts
- [ ] Refactor the alarm engine behind a uniform command/event interface so UI, background handlers, and future platform adapters all speak the same API
- [ ] i18n (English + Italian, following Blueprint's next-intl pattern)
- [ ] Optional manual theme override (dark/light/system)
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
- [ ] Revisit battery optimization guidance if a non-disruptive OEM-safe flow emerges
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
├── turbo.json
├── package.json                  # Workspace root
├── biome.json                    # Root Biome config
├── renovate.json
├── .husky/
├── .github/workflows/ci.yml
├── TODO.md
└── CLAUDE.md
```
