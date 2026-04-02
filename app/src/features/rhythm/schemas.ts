import { z } from "zod";

export const intensityLevel = z.enum(["whisper", "nudge", "pulse", "call"]);

export type IntensityLevel = z.infer<typeof intensityLevel>;

export const rhythmSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  days: z.array(z.number().min(0).max(6)).min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  intervalMinutes: z.number().min(1).max(1440),
  intensity: intensityLevel,
  enabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Rhythm = z.infer<typeof rhythmSchema>;

export const createRhythmSchema = rhythmSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateRhythm = z.infer<typeof createRhythmSchema>;
