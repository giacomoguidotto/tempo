# Frontend

Visual precision is product work. Spacing, easing, timing, color transitions, and gesture feel are not polish tasks — treat "this feels clunky" with the same urgency as a functional bug.

## Styling

NativeWind v5 (preview) with Tailwind CSS v4. Theme tokens defined as CSS custom properties in `src/global.css` — use semantic class names (`bg-background`, `text-foreground`, `text-accent`) not raw hex values.

Dark/light mode is system-controlled via `@media (prefers-color-scheme: dark)`. Never hardcode a single theme. Do not add an in-app theme toggle.

`className` on `TextInput` crashes with `path.split is not a function` — use inline `style` objects for all `TextInput` components.

`app/src/global.css` is excluded from Biome formatting because the required multi-line Tailwind imports get collapsed. Root `package.json` pins `lightningcss` to `1.30.1` in `resolutions` — newer transitive versions break `react-native-css` serialization.

## Brand — "Warm Analog"

Inspired by vintage audio equipment. Brand consistency can override native defaults — if the native version breaks Tempo's visual language, use or build the branded version intentionally.

- **Display font:** Fraunces (headings, rhythm names)
- **Mono font:** IBM Plex Mono (timestamps, labels, metadata)
- **Accent:** copper/amber — use `accent` token, never raw `#C06730`
- **Palette:** Background `#1A1714` / `#F7F3EE`, Surface `#2A2420` / `#FFFFFF`, Accent `#C06730`, Border `#3D352E` / `#E8E2DA`

## Components

Base primitives from React Native Reusables (shadcn/ui port for RN + NativeWind). Copy-paste-and-own in `src/components/ui/`, then customize for Tempo's brand.

Use `ConfirmDialog` instead of `Alert.alert` when the system dialog breaks Tempo's visual consistency.

Sliders inside `@gorhom/bottom-sheet` conflict with the sheet's pan gesture. Wrap slider components in `NativeViewGestureHandler` or toggle `enableContentPanningGesture` off while dragging.

## Animations

Reanimated for gesture-driven and layout animations. The signature animation is a VU meter / waveform visualization on the home screen hero — use `useFrameCallback`, not JS/UI thread blending.

## Forms

"Clean Editorial" feel: large tappable mono numerals, thin underline affordances, restrained dividers, accent-tinted chips, and wheel-picker modals for time and interval selection. Random presets on open are a feature, not a gimmick.

Use `@quidone/react-native-wheel-picker` in a modal, never inline inside a scrollable container. The library's types are incomplete — cast to `React.ComponentType<Record<string, unknown>>` for working runtime props.
