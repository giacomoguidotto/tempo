import { openDatabaseSync } from "expo-sqlite";

let migrated = false;

export function runMigrations() {
  if (migrated) {
    return;
  }
  try {
    const db = openDatabaseSync("tempo.db");
    db.execSync(`
      CREATE TABLE IF NOT EXISTS rhythms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        days TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        interval_minutes INTEGER NOT NULL,
        intensity TEXT NOT NULL CHECK (intensity IN ('whisper', 'nudge', 'pulse', 'call')),
        enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    // v2: add sort_order column (ignore if exists)
    try {
      db.execSync(
        "ALTER TABLE rhythms ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;"
      );
    } catch {
      // column already exists
    }
    migrated = true;
  } catch {
    // Native module not ready yet (hot reload) — will retry on next render
  }
}
