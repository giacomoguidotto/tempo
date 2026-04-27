import { describe, expect, it } from "vitest";
import { computeRhythmProgress } from "./rhythm-progress";
import type { Rhythm } from "./schemas";

function makeRhythm(overrides: Partial<Rhythm> = {}): Rhythm {
  return {
    createdAt: "2026-04-08T10:00:00.000Z",
    days: [1, 2, 3, 4, 5],
    enabled: true,
    endTime: "17:00",
    id: "rhythm-a",
    intensity: "nudge",
    intervalMinutes: 60,
    name: "Focus",
    sortOrder: 0,
    startTime: "09:00",
    updatedAt: "2026-04-08T10:00:00.000Z",
    ...overrides,
  };
}

describe("computeRhythmProgress", () => {
  it("returns zero progress when today is not a scheduled day", () => {
    // Sunday = day 0, not in [1,2,3,4,5]
    const now = new Date(2026, 3, 12, 12, 0); // Sunday
    const result = computeRhythmProgress(makeRhythm(), now);

    expect(result.done).toBe(0);
    expect(result.total).toBe(0);
    expect(result.allDoneForToday).toBe(false);
  });

  it("returns zero done with correct total before the first beat", () => {
    // Wednesday = day 3, in schedule. 8:00 is before 09:00 start
    const now = new Date(2026, 3, 8, 8, 0); // Wednesday 8:00am
    const result = computeRhythmProgress(makeRhythm(), now);

    expect(result.done).toBe(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.allDoneForToday).toBe(false);
  });

  it("counts completed beats and shows progress toward next", () => {
    // Wednesday at 10:30 — first beat at 09:00 is done, second at 10:00 is done
    // 30 minutes into the 60-min interval = 0.5 progress
    const now = new Date(2026, 3, 8, 10, 30);
    const result = computeRhythmProgress(makeRhythm(), now);

    expect(result.done).toBe(2); // 09:00, 10:00
    expect(result.total).toBeGreaterThan(2);
    expect(result.currentProgress).toBeCloseTo(0.5, 1);
    expect(result.allDoneForToday).toBe(false);
  });

  it("marks all done when past the last beat", () => {
    // Wednesday at 18:00 — past 17:00 end time
    const now = new Date(2026, 3, 8, 18, 0);
    const result = computeRhythmProgress(makeRhythm(), now);

    expect(result.allDoneForToday).toBe(true);
    expect(result.done).toBe(result.total);
    expect(result.currentProgress).toBe(1);
  });

  it("returns next beat time as HH:MM for same-day beats", () => {
    // Wednesday at 10:30 — next beat is 11:00
    const now = new Date(2026, 3, 8, 10, 30);
    const result = computeRhythmProgress(makeRhythm(), now);

    expect(result.nextBeat).toBe("11:00");
  });

  it("returns null nextBeat when all done for today", () => {
    const now = new Date(2026, 3, 8, 18, 0);
    const result = computeRhythmProgress(makeRhythm(), now);

    expect(result.nextBeat).toBeNull();
  });

  it("returns null nextBeat when next beat is on a different day", () => {
    // Sunday — not in schedule, next beat is Monday
    const now = new Date(2026, 3, 12, 12, 0);
    const result = computeRhythmProgress(makeRhythm(), now);

    expect(result.nextBeat).toBeNull();
  });
});
