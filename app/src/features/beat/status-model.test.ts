import { describe, expect, it } from "vitest";
import type { Rhythm } from "@/features/rhythm/schemas";
import { buildStatusNotificationModel } from "./status-model";

function makeRhythm(overrides: Partial<Rhythm> = {}): Rhythm {
  return {
    createdAt: "2026-04-08T10:00:00.000Z",
    days: [1, 2, 3],
    enabled: true,
    endTime: "17:00",
    id: "rhythm-a",
    intensity: "nudge",
    intervalMinutes: 25,
    name: "Focus",
    sortOrder: 0,
    startTime: "09:00",
    updatedAt: "2026-04-08T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildStatusNotificationModel", () => {
  it("prefers lower sort order when multiple rhythms share the same next beat", () => {
    const now = new Date("2026-04-08T10:00:00.000Z");
    const nextBeat = new Date("2026-04-08T10:10:00.000Z");

    const model = buildStatusNotificationModel(
      [
        {
          nextBeat,
          rhythm: makeRhythm({
            id: "later-in-list",
            name: "Stretch",
            sortOrder: 2,
          }),
        },
        {
          nextBeat,
          rhythm: makeRhythm({
            id: "first-in-list",
            name: "Deep Work",
            sortOrder: 0,
          }),
        },
      ].sort((left, right) => left.rhythm.sortOrder - right.rhythm.sortOrder),
      now
    );

    expect(model).toEqual(
      expect.objectContaining({
        primaryRhythmId: "first-in-list",
        title: "Deep Work",
      })
    );
  });

  it("uses the same-time overflow summary when more than three rhythms share the next beat", () => {
    const now = new Date("2026-04-08T10:00:00.000Z");
    const nextBeat = new Date("2026-04-08T10:10:00.000Z");

    const model = buildStatusNotificationModel(
      [
        { nextBeat, rhythm: makeRhythm({ id: "a", name: "A", sortOrder: 0 }) },
        { nextBeat, rhythm: makeRhythm({ id: "b", name: "B", sortOrder: 1 }) },
        { nextBeat, rhythm: makeRhythm({ id: "c", name: "C", sortOrder: 2 }) },
        { nextBeat, rhythm: makeRhythm({ id: "d", name: "D", sortOrder: 3 }) },
      ],
      now
    );

    expect(model?.lines).toContain("Also going off at the same time");
    expect(model?.lines).toContain("+ 1 going off at the same time");
  });

  it("groups visible same-time alarms separately from later alarms", () => {
    const now = new Date(2026, 3, 8, 10, 0);

    const model = buildStatusNotificationModel(
      [
        {
          nextBeat: new Date(2026, 3, 8, 10, 10),
          rhythm: makeRhythm({ id: "a", name: "Soonest", sortOrder: 0 }),
        },
        {
          nextBeat: new Date(2026, 3, 8, 10, 10),
          rhythm: makeRhythm({ id: "b", name: "Same Time", sortOrder: 1 }),
        },
        {
          nextBeat: new Date(2026, 3, 8, 10, 20),
          rhythm: makeRhythm({ id: "c", name: "Later", sortOrder: 2 }),
        },
      ],
      now
    );

    expect(model?.lines).toEqual([
      "Next in 10 min - 10:10",
      "Also going off at the same time",
      "Same Time: next 10:10",
      "Others",
      "Later: next 10:20",
    ]);
  });

  it("adds an Others section before additional rhythms", () => {
    const now = new Date(2026, 3, 8, 10, 0);

    const model = buildStatusNotificationModel(
      [
        {
          nextBeat: new Date(2026, 3, 8, 10, 10),
          rhythm: makeRhythm({ id: "a", name: "Soonest", sortOrder: 0 }),
        },
        {
          nextBeat: new Date(2026, 3, 8, 10, 20),
          rhythm: makeRhythm({ id: "b", name: "Second", sortOrder: 1 }),
        },
      ],
      now
    );

    expect(model?.lines).toEqual([
      "Next in 10 min - 10:10",
      "Others",
      "Second: next 10:20",
    ]);
  });

  it("formats future additional rhythms with weekday names instead of clock times", () => {
    const now = new Date("2026-04-08T10:00:00.000Z");

    const model = buildStatusNotificationModel(
      [
        {
          nextBeat: new Date("2026-04-08T10:10:00.000Z"),
          rhythm: makeRhythm({ id: "a", name: "Soonest", sortOrder: 0 }),
        },
        {
          nextBeat: new Date("2026-04-10T08:00:00.000Z"),
          rhythm: makeRhythm({ id: "b", name: "Friday Rhythm", sortOrder: 1 }),
        },
      ],
      now
    );

    expect(model?.lines).toContain("Friday Rhythm: next Friday");
  });

  it("shows day-based relative text in the primary line when the next beat is more than 24 hours away", () => {
    const now = new Date(2026, 3, 8, 10, 0);

    const model = buildStatusNotificationModel(
      [
        {
          nextBeat: new Date(2026, 3, 10, 8, 0),
          rhythm: makeRhythm({ id: "a", name: "Friday Rhythm", sortOrder: 0 }),
        },
      ],
      now
    );

    expect(model?.lines[0]).toBe("Next in 2 days - Friday");
  });

  it("uses the singular form when only one later rhythm is hidden", () => {
    const now = new Date(2026, 3, 8, 10, 0);

    const model = buildStatusNotificationModel(
      [
        {
          nextBeat: new Date(2026, 3, 8, 10, 10),
          rhythm: makeRhythm({ id: "a", name: "Soonest", sortOrder: 0 }),
        },
        {
          nextBeat: new Date(2026, 3, 8, 10, 20),
          rhythm: makeRhythm({ id: "b", name: "Second", sortOrder: 1 }),
        },
        {
          nextBeat: new Date(2026, 3, 8, 10, 30),
          rhythm: makeRhythm({ id: "c", name: "Third", sortOrder: 2 }),
        },
        {
          nextBeat: new Date(2026, 3, 8, 10, 40),
          rhythm: makeRhythm({ id: "d", name: "Fourth", sortOrder: 3 }),
        },
      ],
      now
    );

    expect(model?.lines).toContain("+ 1 other");
  });
});
