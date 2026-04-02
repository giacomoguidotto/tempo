export const colors = {
  light: {
    background: "#F7F3EE",
    surface: "#FFFFFF",
    border: "#E8E2DA",
    foreground: "#2A2420",
    secondary: "#9C8E80",
    muted: "#C4BAB0",
    accent: "#C06730",
    accentGlow: "rgba(192, 103, 48, 0.3)",
  },
  dark: {
    background: "#1A1714",
    surface: "#2A2420",
    border: "#3D352E",
    foreground: "#EDE6DA",
    secondary: "#7A6F63",
    muted: "#4A433C",
    accent: "#C06730",
    accentGlow: "rgba(192, 103, 48, 0.4)",
  },
} as const;

export const fonts = {
  display: "Fraunces",
  mono: "IBMPlexMono",
} as const;

export const intensity = {
  whisper: {
    label: "Whisper",
    vibration: "short",
    sound: false,
    fullScreen: false,
  },
  nudge: { label: "Nudge", vibration: "short", sound: true, fullScreen: false },
  pulse: { label: "Pulse", vibration: "short", sound: true, fullScreen: true },
  call: { label: "Call", vibration: "long", sound: true, fullScreen: true },
} as const;
