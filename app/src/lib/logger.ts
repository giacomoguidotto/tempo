import type { Notification } from "@notifee/react-native";

// ── Domain event definitions ────────────────────────────────────────

interface BeatEvents {
  delivered: BeatPayload;
  dismissed: BeatPayload;
  opened: BeatPayload;
  permission_check: { source: string; result?: string };
  permission_denied: { source: string; permission: string };
  permission_granted: { source: string };
  schedule: BeatPayload;
  schedule_failed: BeatPayload;
  schedule_skipped: BeatPayload;
  status_cancel: { source: string };
  status_refresh: { source: string };
  status_sync: { source: string; rhythmCount?: number };
  superseded: BeatPayload;
  top_off: BeatPayload;
}

interface BeatPayload {
  alarmInstanceId?: string | null;
  detail?: string | null;
  intensity?: string | null;
  notificationId?: string | null;
  pendingCount?: number | null;
  rhythmId?: string | null;
  rhythmName?: string | null;
  scheduledAt?: string | null;
  source: string;
}

interface RhythmEvents {
  create: { rhythmId: string; name: string };
  delete: { rhythmId: string };
  reorder: { count: number };
  toggle: { rhythmId: string; enabled: boolean };
  update: { rhythmId: string; fields: string[] };
}

interface DbEvents {
  migration: { durationMs?: number };
  migration_failed: { error: string };
  open: Record<string, never>;
}

interface DomainMap {
  beat: BeatEvents;
  db: DbEvents;
  rhythm: RhythmEvents;
}

// ── Level inference ─────────────────────────────────────────────────

type Level = "info" | "warn" | "error";

function inferLevel(event: string): Level {
  if (event.endsWith("_failed")) {
    return "error";
  }
  if (event.endsWith("_skipped") || event.endsWith("_denied")) {
    return "warn";
  }
  return "info";
}

// ── Domain logger factory ───────────────────────────────────────────

interface DomainLogger<E> {
  error: <K extends keyof E & string>(event: K, data: E[K]) => void;
  info: <K extends keyof E & string>(event: K, data: E[K]) => void;
  warn: <K extends keyof E & string>(event: K, data: E[K]) => void;
}

function createDomainLogger<D extends keyof DomainMap>(
  domain: D
): DomainLogger<DomainMap[D]> {
  function emit(
    event: string,
    data: Record<string, unknown>,
    overrideLevel?: Level
  ) {
    const level = overrideLevel ?? inferLevel(event);
    const entry = {
      at: new Date().toISOString(),
      level,
      event,
      ...Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      ),
    };
    console.info(`[tempo:${domain}]`, JSON.stringify(entry));
  }

  return {
    info: (event, data) =>
      emit(event as string, data as Record<string, unknown>, "info"),
    warn: (event, data) =>
      emit(event as string, data as Record<string, unknown>, "warn"),
    error: (event, data) =>
      emit(event as string, data as Record<string, unknown>, "error"),
  };
}

// ── Exported domain loggers ─────────────────────────────────────────

export const beat = createDomainLogger("beat");
export const rhythm = createDomainLogger("rhythm");
export const database = createDomainLogger("db");

// ── Notification payload helper ─────────────────────────────────────

export function extractBeatPayload(
  notification: Notification | undefined,
  source: string
): BeatPayload {
  return {
    source,
    alarmInstanceId:
      (notification?.data?.alarmInstanceId as string | undefined) ??
      notification?.id ??
      null,
    intensity: (notification?.data?.intensity as string | undefined) ?? null,
    notificationId: notification?.id ?? null,
    rhythmId: (notification?.data?.rhythmId as string | undefined) ?? null,
    rhythmName: (notification?.data?.rhythmName as string | undefined) ?? null,
    scheduledAt:
      (notification?.data?.scheduledAt as string | undefined) ?? null,
  };
}
