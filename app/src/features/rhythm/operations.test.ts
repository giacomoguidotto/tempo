import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface MockRhythmRow {
  createdAt: string;
  days: string;
  enabled: boolean;
  endTime: string;
  id: string;
  intensity: "call" | "nudge" | "pulse" | "whisper";
  intervalMinutes: number;
  name: string;
  sortOrder: number;
  startTime: string;
  updatedAt: string;
}

const { dbMock, mockState } = vi.hoisted(() => {
  const state = {
    rows: [] as MockRhythmRow[],
  };

  const db = {
    delete: vi.fn(() => ({
      where: vi.fn(
        (predicate: { column: keyof MockRhythmRow; value: unknown }) => ({
          run: () => {
            state.rows = state.rows.filter(
              (candidate) => candidate[predicate.column] !== predicate.value
            );
          },
        })
      ),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((row: MockRhythmRow) => ({
        run: () => {
          state.rows.push({ ...row });
        },
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        all: () => state.rows.map((row) => ({ ...row })),
        orderBy: (order: { column: keyof MockRhythmRow }) => ({
          all: () =>
            [...state.rows]
              .sort(
                (left, right) =>
                  Number(left[order.column]) - Number(right[order.column])
              )
              .map((row) => ({ ...row })),
        }),
        where: (predicate: {
          column: keyof MockRhythmRow;
          value: unknown;
        }) => ({
          get: () => {
            const row = state.rows.find(
              (candidate) => candidate[predicate.column] === predicate.value
            );
            return row ? { ...row } : undefined;
          },
        }),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn((updates: Partial<MockRhythmRow>) => ({
        where: vi.fn(
          (predicate: { column: keyof MockRhythmRow; value: unknown }) => ({
            run: () => {
              const row = state.rows.find(
                (candidate) => candidate[predicate.column] === predicate.value
              );
              if (row) {
                Object.assign(row, updates);
              }
            },
          })
        ),
      })),
    })),
  };

  return {
    dbMock: db,
    mockState: state,
  };
});

vi.mock("drizzle-orm", () => ({
  asc: (column: keyof MockRhythmRow) => ({ column }),
  eq: (column: keyof MockRhythmRow, value: unknown) => ({ column, value }),
}));

vi.mock("@/lib/db", () => ({
  db: dbMock,
}));

vi.mock("@/lib/schema", () => ({
  rhythms: {
    id: "id",
    sortOrder: "sortOrder",
  },
}));

vi.mock("@/lib/logger", () => {
  // biome-ignore lint/suspicious/noEmptyBlockStatements: test stub
  const noop = () => {};
  return { rhythm: { info: noop, warn: noop, error: noop } };
});

import {
  createRhythm,
  deleteRhythm,
  getAllRhythms,
  getRhythm,
  reorderRhythms,
  toggleRhythm,
  updateRhythm,
} from "./operations";

const NOW = "2026-04-08T10:00:00.000Z";

function makeRow(overrides: Partial<MockRhythmRow> = {}): MockRhythmRow {
  return {
    createdAt: "2026-04-07T08:00:00.000Z",
    days: JSON.stringify([1, 3, 5]),
    enabled: true,
    endTime: "17:00",
    id: "rhythm-a",
    intensity: "nudge",
    intervalMinutes: 25,
    name: "Deep Work",
    sortOrder: 0,
    startTime: "09:00",
    updatedAt: "2026-04-07T08:00:00.000Z",
    ...overrides,
  };
}

describe("rhythm operations", () => {
  beforeEach(() => {
    mockState.rows = [];
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns all rhythms ordered by sort order and deserializes days", () => {
    mockState.rows = [
      makeRow({ id: "second", days: JSON.stringify([2, 4]), sortOrder: 1 }),
      makeRow({
        id: "first",
        days: JSON.stringify([0, 6]),
        name: "Morning Reset",
        sortOrder: 0,
      }),
    ];

    expect(getAllRhythms()).toEqual([
      expect.objectContaining({
        days: [0, 6],
        id: "first",
        name: "Morning Reset",
      }),
      expect.objectContaining({
        days: [2, 4],
        id: "second",
      }),
    ]);
  });

  it("returns a single rhythm by id and undefined when missing", () => {
    mockState.rows = [
      makeRow({ id: "focus", days: JSON.stringify([1, 2, 3]) }),
    ];

    expect(getRhythm("focus")).toEqual(
      expect.objectContaining({
        days: [1, 2, 3],
        id: "focus",
      })
    );
    expect(getRhythm("missing")).toBeUndefined();
  });

  it("creates a rhythm with serialized days, generated id, timestamps, and next sort order", () => {
    mockState.rows = [makeRow({ id: "existing", sortOrder: 0 })];

    const created = createRhythm({
      days: [0, 2, 4],
      enabled: true,
      endTime: "18:00",
      intensity: "pulse",
      intervalMinutes: 45,
      name: "Workout",
      startTime: "12:00",
    });

    expect(created).toEqual({
      createdAt: NOW,
      days: [0, 2, 4],
      enabled: true,
      endTime: "18:00",
      id: "00000000-0000-0000-0000-000000000000",
      intensity: "pulse",
      intervalMinutes: 45,
      name: "Workout",
      sortOrder: 1,
      startTime: "12:00",
      updatedAt: NOW,
    });

    expect(mockState.rows).toContainEqual({
      createdAt: NOW,
      days: JSON.stringify([0, 2, 4]),
      enabled: true,
      endTime: "18:00",
      id: "00000000-0000-0000-0000-000000000000",
      intensity: "pulse",
      intervalMinutes: 45,
      name: "Workout",
      sortOrder: 1,
      startTime: "12:00",
      updatedAt: NOW,
    });
  });

  it("updates only the provided fields and returns the deserialized rhythm", () => {
    mockState.rows = [makeRow()];

    const updated = updateRhythm("rhythm-a", {
      days: [0, 6],
      intensity: "pulse",
      name: "Deep Work PM",
    });

    expect(updated).toEqual({
      createdAt: "2026-04-07T08:00:00.000Z",
      days: [0, 6],
      enabled: true,
      endTime: "17:00",
      id: "rhythm-a",
      intensity: "pulse",
      intervalMinutes: 25,
      name: "Deep Work PM",
      sortOrder: 0,
      startTime: "09:00",
      updatedAt: NOW,
    });

    expect(mockState.rows[0]).toEqual({
      createdAt: "2026-04-07T08:00:00.000Z",
      days: JSON.stringify([0, 6]),
      enabled: true,
      endTime: "17:00",
      id: "rhythm-a",
      intensity: "pulse",
      intervalMinutes: 25,
      name: "Deep Work PM",
      sortOrder: 0,
      startTime: "09:00",
      updatedAt: NOW,
    });
  });

  it("returns undefined when updating a missing rhythm", () => {
    expect(updateRhythm("missing", { name: "Nope" })).toBeUndefined();
  });

  it("toggles and deletes rhythms", () => {
    mockState.rows = [makeRow({ enabled: true, id: "toggle-me" })];

    toggleRhythm("toggle-me", false);
    expect(mockState.rows[0]).toEqual(
      expect.objectContaining({
        enabled: false,
        updatedAt: NOW,
      })
    );

    deleteRhythm("toggle-me");
    expect(mockState.rows).toEqual([]);
  });

  it("reorders rhythms according to the provided ids", () => {
    mockState.rows = [
      makeRow({ id: "first", sortOrder: 0 }),
      makeRow({ id: "second", sortOrder: 1 }),
      makeRow({ id: "third", sortOrder: 2 }),
    ];

    reorderRhythms(["third", "first", "second"]);

    expect(getAllRhythms().map((rhythm) => rhythm.id)).toEqual([
      "third",
      "first",
      "second",
    ]);
    expect(mockState.rows.map((row) => row.sortOrder)).toEqual([1, 2, 0]);
  });
});
