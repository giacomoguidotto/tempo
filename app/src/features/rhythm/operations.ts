import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rhythms } from "@/lib/schema";
import type { CreateRhythm, Rhythm } from "./schemas";

export function getAllRhythms(): Rhythm[] {
  const rows = db.select().from(rhythms).orderBy(asc(rhythms.sortOrder)).all();
  return rows.map(deserialize);
}

export function getRhythm(id: string): Rhythm | undefined {
  const row = db.select().from(rhythms).where(eq(rhythms.id, id)).get();
  return row ? deserialize(row) : undefined;
}

export function createRhythm(input: CreateRhythm): Rhythm {
  const now = new Date().toISOString();
  const id = uid();
  const count = db.select().from(rhythms).all().length;
  const row = {
    id,
    name: input.name,
    days: JSON.stringify(input.days),
    startTime: input.startTime,
    endTime: input.endTime,
    intervalMinutes: input.intervalMinutes,
    intensity: input.intensity,
    enabled: input.enabled,
    sortOrder: count,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(rhythms).values(row).run();
  return deserialize(row);
}

export function updateRhythm(
  id: string,
  input: Partial<CreateRhythm>
): Rhythm | undefined {
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };
  if (input.name !== undefined) {
    updates.name = input.name;
  }
  if (input.days !== undefined) {
    updates.days = JSON.stringify(input.days);
  }
  if (input.startTime !== undefined) {
    updates.startTime = input.startTime;
  }
  if (input.endTime !== undefined) {
    updates.endTime = input.endTime;
  }
  if (input.intervalMinutes !== undefined) {
    updates.intervalMinutes = input.intervalMinutes;
  }
  if (input.intensity !== undefined) {
    updates.intensity = input.intensity;
  }
  if (input.enabled !== undefined) {
    updates.enabled = input.enabled;
  }

  db.update(rhythms).set(updates).where(eq(rhythms.id, id)).run();
  return getRhythm(id);
}

export function toggleRhythm(id: string, enabled: boolean): void {
  db.update(rhythms)
    .set({ enabled, updatedAt: new Date().toISOString() })
    .where(eq(rhythms.id, id))
    .run();
}

export function deleteRhythm(id: string): void {
  db.delete(rhythms).where(eq(rhythms.id, id)).run();
}

export function reorderRhythms(orderedIds: string[]): void {
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(rhythms)
      .set({ sortOrder: i })
      .where(eq(rhythms.id, orderedIds[i]))
      .run();
  }
}

function uid(): string {
  const h = "0123456789abcdef";
  const s = (n: number) => {
    let o = "";
    for (let i = 0; i < n; i++) {
      o += h[Math.floor(Math.random() * 16)];
    }
    return o;
  };
  return `${s(8)}-${s(4)}-${s(4)}-${s(4)}-${s(12)}`;
}

function deserialize(row: typeof rhythms.$inferSelect): Rhythm {
  return {
    ...row,
    days: JSON.parse(row.days) as number[],
  };
}
