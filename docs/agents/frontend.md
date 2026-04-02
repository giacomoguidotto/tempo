# Frontend

## Styling

NativeWind v4 with Tailwind CSS v4. Theme tokens defined as CSS custom properties in `src/global.css` — use semantic class names (`bg-background`, `text-foreground`, `text-accent`) not raw hex values.

Dark/light mode is system-controlled — both palettes are defined via `@media (prefers-color-scheme: dark)`. Never hardcode a single theme.

## Brand — "Warm Analog"

- **Display font:** Fraunces (headings, rhythm names)
- **Mono font:** IBM Plex Mono (timestamps, labels, metadata)
- **Accent:** copper/amber — use `accent` token, never raw `#C06730`

## Components

Base primitives from React Native Reusables (shadcn/ui port for RN + NativeWind). Copy-paste-and-own in `src/components/ui/`, then customize for Tempo's brand.

Icons via `lucide-react-native`.

## Animations

Reanimated for gesture-driven and layout animations. The signature animation is a VU meter / waveform visualization on the home screen hero.
