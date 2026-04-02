import { describe, expect, it } from "vitest";
import { createRhythmSchema, intensityLevel, rhythmSchema } from "./schemas";

describe("intensityLevel", () => {
  it("accepts valid levels", () => {
    for (const level of ["whisper", "nudge", "pulse", "call"]) {
      expect(intensityLevel.parse(level)).toBe(level);
    }
  });

  it("rejects invalid levels", () => {
    expect(() => intensityLevel.parse("loud")).toThrow();
  });
});

describe("rhythmSchema", () => {
  const valid = {
    id: "abc123",
    name: "Deep Work",
    days: [1, 2, 3, 4, 5],
    startTime: "09:00",
    endTime: "17:00",
    intervalMinutes: 25,
    intensity: "nudge" as const,
    enabled: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("accepts a valid rhythm", () => {
    expect(rhythmSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty name", () => {
    expect(() => rhythmSchema.parse({ ...valid, name: "" })).toThrow();
  });

  it("rejects empty days array", () => {
    expect(() => rhythmSchema.parse({ ...valid, days: [] })).toThrow();
  });

  it("rejects invalid time format", () => {
    expect(() => rhythmSchema.parse({ ...valid, startTime: "9:00" })).toThrow();
  });

  it("rejects interval out of range", () => {
    expect(() =>
      rhythmSchema.parse({ ...valid, intervalMinutes: 0 })
    ).toThrow();
    expect(() =>
      rhythmSchema.parse({ ...valid, intervalMinutes: 1441 })
    ).toThrow();
  });
});

describe("createRhythmSchema", () => {
  it("omits id, createdAt, updatedAt", () => {
    const input = {
      name: "Hydration",
      days: [0, 1, 2, 3, 4, 5, 6],
      startTime: "08:00",
      endTime: "22:00",
      intervalMinutes: 45,
      intensity: "whisper" as const,
      enabled: true,
    };
    expect(createRhythmSchema.parse(input)).toEqual(input);
  });
});
