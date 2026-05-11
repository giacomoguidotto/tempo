import { createDrizzleRepository } from "./drizzle-repository";
import type { RhythmRepository } from "./repository";

export type { RhythmRepository } from "./repository";
export type { CreateRhythm, Rhythm } from "./schemas";

export const rhythmRepository: RhythmRepository = createDrizzleRepository();
