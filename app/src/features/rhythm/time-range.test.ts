import { describe, expect, it } from "vitest";
import {
  crossesMidnight,
  getRelevantWindowBeats,
  getUpcomingBeatDates,
  minutesToTime,
  timeToMinutes,
} from "./time-range";

const overnightRhythm = {
  days: [1],
  startTime: "23:00",
  endTime: "02:00",
  intervalMinutes: 60,
};

describe("time-range helpers", () => {
  it("round-trips times through minutes", () => {
    expect(minutesToTime(timeToMinutes("09:30"))).toBe("09:30");
    expect(minutesToTime(24 * 60)).toBe("00:00");
  });

  it("detects overnight ranges", () => {
    expect(crossesMidnight("23:00", "02:00")).toBe(true);
    expect(crossesMidnight("09:00", "17:00")).toBe(false);
  });

  it("returns upcoming beats across midnight from the start day", () => {
    const now = new Date(2026, 3, 6, 22, 30);
    const beats = getUpcomingBeatDates(overnightRhythm, 3, now);

    expect(
      beats.map((beat) => [beat.getDay(), beat.getHours(), beat.getMinutes()])
    ).toEqual([
      [1, 23, 0],
      [2, 0, 0],
      [2, 1, 0],
    ]);
  });

  it("still finds the remaining overnight beat after midnight", () => {
    const now = new Date(2026, 3, 7, 1, 15);
    const beats = getUpcomingBeatDates(overnightRhythm, 1, now);

    expect(
      beats.map((beat) => [beat.getDay(), beat.getHours(), beat.getMinutes()])
    ).toEqual([[2, 2, 0]]);
  });

  it("uses the active overnight window for progress calculations", () => {
    const now = new Date(2026, 3, 7, 0, 30);
    const beats = getRelevantWindowBeats(overnightRhythm, now);

    expect(
      beats.map((beat) => [beat.getDay(), beat.getHours(), beat.getMinutes()])
    ).toEqual([
      [1, 23, 0],
      [2, 0, 0],
      [2, 1, 0],
      [2, 2, 0],
    ]);
  });
});
