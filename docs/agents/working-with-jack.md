# Working with Jack on Tempo

Read `docs/agents/manifesto.md` first. This document captures the Tempo-specific collaboration loop, stack traps, and product rules that override the default manifesto when needed.

## Collaboration style

- **Test-driven by feel.** Jack tests on-device immediately after each change. Feedback often comes back as screenshots with annotations rather than a formal spec. If something "feels off," treat that as a real bug report.
- **Rapid iteration beats over-design.** Expect multiple passes per feature. Ship the simplest version that can be judged, let Jack react, then refine.
- **Visual precision is product work.** Spacing, easing, timing, color transitions, and gesture feel are not polish tasks. Treat "this feels clunky" with the same urgency as a functional bug.
- **Prefer the user's mental model, but stay truthful.** Alarm labels, states, and transitions should make sense to a tired human at 10pm, not just to the implementation.
- **Brand consistency can override native defaults.** Prefer native primitives and maintained libraries by default, but if the native version breaks Tempo's visual language or interaction quality, use or build the branded version intentionally.
- **Reduce blank-state friction.** Pre-fill forms, offer presets, and keep the path from open to useful as short as possible.

## Stack gotchas

- **Bun hoisting:** Bun puts dependencies in `node_modules/.bun/` with hashed paths. Gradle's `require.resolve` and native module auto-linking often cannot find them. When a native build fails with "module not found," the fix is usually adding the package as an explicit dependency in `app/package.json` so Bun creates a resolvable symlink. This has affected Notifee, `react-native-worklets`, and others.
- **Node 24 + CommonJS config:** Node 24 still treats `.js` files as CommonJS unless `"type": "module"` is set. Tempo keeps `"type": "commonjs"` in `app/package.json` because Metro config, Expo config plugins, and related RN tooling still expect CommonJS here. Config files that use `require()` are excluded from Biome so the linter does not try to rewrite them into incompatible module syntax.
- **NativeWind preview + Tailwind CSS v4:** The app uses the current NativeWind preview build with Tailwind CSS v4. Known issue: `className` on `TextInput` crashes with `path.split is not a function`. Use inline `style` objects for all `TextInput` components. `app/src/global.css` is excluded from Biome formatting because the required multi-line Tailwind imports get collapsed.
- **`lightningcss` pinned:** Root `package.json` pins `"lightningcss": "1.30.1"` in `resolutions`. Newer transitive versions break `react-native-css` serialization.
- **Expo SDK 55 + RN 0.83.4:** React Native is intentionally pinned to `0.83.4`. Reanimated `4.2.1` requires `react-native-worklets` around `0.7.4`, not `0.8.x`. Gesture Handler must stay on `2.31+`; older `2.20-2.24` releases rely on a removed C++ API.

## Architecture patterns

- **Notifee background handler:** Register `onBackgroundEvent` at the app entry point in `app/index.js`, outside React. If it is registered inside a `useEffect`, Android wake-from-killed-state flows fail with `No task registered for key app.notifee.notification-event`.
- **Full-screen alarm intents:** Three pieces are required together: `fullScreenAction` in the notification config, `showWhenLocked` and `turnScreenOn` on `MainActivity` via `plugins/with-alarm-activity.js`, and a `USE_FULL_SCREEN_INTENT` permission check on Android 14+.
- **Cold-start notification routing:** When the app opens from a notification intent, use `notifee.getInitialNotification()` on mount to determine the launch source and route accordingly.
- **Bottom sheet + sliders:** Sliders inside `@gorhom/bottom-sheet` must use the RN Responder system, not Gesture Handler. The sheet will consume Gesture Handler events first. While dragging a slider, temporarily disable the sheet's pan gestures via `onDragStart` and `onDragEnd`.
- **Wheel picker:** Use `@quidone/react-native-wheel-picker` in a modal, never inline inside a scrollable container. The library's types are incomplete, so the component is cast to `React.ComponentType<Record<string, unknown>>` for working runtime props that are missing from the type definitions.
- **SQLite migrations:** Run migrations inside `useEffect` on mount, not at module scope. Metro hot reload can re-evaluate modules before the SQLite bridge is ready. Guard migrations with `try/catch` and an idempotency flag. Wrap `ALTER TABLE ADD COLUMN` changes in `try/catch` because they fail harmlessly when the column already exists.
- **Biome excludes:** `biome.json` intentionally excludes `global.css`, `app.json`, `metro.config.js`, `plugins/*.js`, and `app/index.js` from some or all formatting and linting because those files break under normal transformations.

## Design rules

- **Brand:** "Warm Analog," inspired by vintage audio equipment.
- **Palette:** Background `#1A1714` / `#F7F3EE`, Surface `#2A2420` / `#FFFFFF`, Accent `#C06730`, Border `#3D352E` / `#E8E2DA`.
- **Fonts:** Fraunces for display text and IBM Plex Mono for labels, timestamps, and metadata.
- **Theme:** System-controlled only. Follow the device theme; do not add an in-app theme toggle.
- **VU meter animation:** Keep it frame-driven with Reanimated `useFrameCallback`. Earlier JS/UI thread blending approaches were visually unstable.
- **Forms:** Preserve the "Clean Editorial" feel: large tappable mono numerals, thin underline affordances, restrained dividers, accent-tinted chips, and wheel-picker modals for time and interval selection. Random presets on open are a feature, not a gimmick.
- **Dialogs:** Use the custom `ConfirmDialog` instead of `Alert.alert` when the system dialog breaks Tempo's visual consistency.