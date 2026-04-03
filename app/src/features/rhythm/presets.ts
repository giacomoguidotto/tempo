import type { IntensityLevel } from "./schemas";

interface RhythmPreset {
  days: number[];
  endTime: string;
  intensity: IntensityLevel;
  intervalMinutes: number;
  name: string;
  startTime: string;
}

export const RHYTHM_PRESETS: RhythmPreset[] = [
  {
    name: "Deep Work",
    days: [1, 2, 3, 4, 5],
    startTime: "09:00",
    endTime: "12:00",
    intervalMinutes: 25,
    intensity: "whisper",
  },
  {
    name: "Hydration",
    days: [0, 1, 2, 3, 4, 5, 6],
    startTime: "08:00",
    endTime: "20:00",
    intervalMinutes: 45,
    intensity: "nudge",
  },
  {
    name: "Stretch Break",
    days: [1, 2, 3, 4, 5],
    startTime: "09:00",
    endTime: "18:00",
    intervalMinutes: 60,
    intensity: "nudge",
  },
  {
    name: "Eye Rest",
    days: [1, 2, 3, 4, 5],
    startTime: "09:00",
    endTime: "17:00",
    intervalMinutes: 20,
    intensity: "whisper",
  },
  {
    name: "Posture Check",
    days: [1, 2, 3, 4, 5],
    startTime: "08:00",
    endTime: "18:00",
    intervalMinutes: 30,
    intensity: "whisper",
  },
  {
    name: "Stand Up",
    days: [1, 2, 3, 4, 5],
    startTime: "09:00",
    endTime: "17:00",
    intervalMinutes: 45,
    intensity: "nudge",
  },
  {
    name: "Medication",
    days: [0, 1, 2, 3, 4, 5, 6],
    startTime: "08:00",
    endTime: "22:00",
    intervalMinutes: 60,
    intensity: "pulse",
  },
  {
    name: "Focus Sprint",
    days: [1, 2, 3, 4, 5],
    startTime: "10:00",
    endTime: "16:00",
    intervalMinutes: 15,
    intensity: "nudge",
  },
  {
    name: "Wind Down",
    days: [0, 1, 2, 3, 4, 5, 6],
    startTime: "20:00",
    endTime: "22:00",
    intervalMinutes: 30,
    intensity: "whisper",
  },
  {
    name: "Snack Time",
    days: [1, 2, 3, 4, 5],
    startTime: "10:00",
    endTime: "16:00",
    intervalMinutes: 90,
    intensity: "nudge",
  },
];

export function randomPreset(): RhythmPreset {
  return RHYTHM_PRESETS[Math.floor(Math.random() * RHYTHM_PRESETS.length)];
}
