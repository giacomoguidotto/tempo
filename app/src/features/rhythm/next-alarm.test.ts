import { describe, expect, it } from "vitest";
import { formatNextAlarm } from "./next-alarm";
import type { Rhythm } from "./schemas";

function makeRhythm(overrides: Partial<Rhythm> = {}): Rhythm {
  return {
    createdAt: "2026-04-08T10:00:00.000Z",
    days: [1],
    enabled: true,
    endTime: "12:00",
    id: "rhythm-a",
    intensity: "nudge",
    intervalMinutes: 60,
    name: "Focus",
    sortOrder: 0,
    startTime: "12:00",
    updatedAt: "2026-04-08T10:00:00.000Z",
    ...overrides,
  };
}

describe("formatNextAlarm", () => {
  it('returns "--:--" when there are no active rhythms', () => {
    expect(formatNextAlarm([])).toBe("--:--");
  });

  it("returns an hours and minutes countdown within the next 24 hours", () => {
    const now = new Date(2026, 3, 6, 10, 0);
    const mondayRhythm = makeRhythm({
      days: [1],
      endTime: "12:00",
      startTime: "12:00",
    });

    expect(formatNextAlarm([mondayRhythm], now)).toBe("02:00");
  });

  it('returns "IN 1 DAY" when the soonest alarm is more than 24 hours away but tomorrow', () => {
    const now = new Date(2026, 3, 6, 10, 0);
    const tomorrowRhythm = makeRhythm({
      days: [2],
      endTime: "11:00",
      startTime: "11:00",
    });

    expect(formatNextAlarm([tomorrowRhythm], now)).toBe("IN 1 DAY");
  });

  it('returns "IN X DAYS" when the soonest alarm is multiple calendar days away', () => {
    const now = new Date(2026, 3, 6, 10, 0);
    const laterRhythm = makeRhythm({
      days: [3],
      endTime: "09:00",
      startTime: "09:00",
    });

    expect(formatNextAlarm([laterRhythm], now)).toBe("IN 2 DAYS");
  });
});
