import { openDatabaseSync } from "expo-sqlite";

let migrated = false;

/**
 * Run versioned schema migrations using PRAGMA user_version.
 * Returns true if migrations completed, false if the native module
 * is not ready (hot reload). Throws on genuine database errors.
 */
export function runMigrations(): boolean {
  if (migrated) {
    return true;
  }

  let db: ReturnType<typeof openDatabaseSync>;
  try {
    db = openDatabaseSync("tempo.db");
  } catch {
    // Native module not ready yet (hot reload) — caller can retry
    return false;
  }

  const version =
    db.getFirstSync<{ user_version: number }>("PRAGMA user_version")
      ?.user_version ?? 0;

  if (version < 1) {
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
    db.execSync("PRAGMA user_version = 1");
  }

  if (version < 2) {
    try {
      db.execSync(
        "ALTER TABLE rhythms ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;"
      );
    } catch {
      // Column already exists — bridging from unversioned database
    }
    db.execSync("PRAGMA user_version = 2");
  }

  migrated = true;
  return true;
}
