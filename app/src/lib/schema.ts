import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const rhythms = sqliteTable("rhythms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  days: text("days").notNull(), // JSON array of day numbers [0-6]
  startTime: text("start_time").notNull(), // "HH:MM"
  endTime: text("end_time").notNull(), // "HH:MM"
  intervalMinutes: integer("interval_minutes").notNull(),
  intensity: text("intensity", {
    enum: ["whisper", "nudge", "pulse", "call"],
  }).notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
