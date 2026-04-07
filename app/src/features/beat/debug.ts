import type { Notification } from "@notifee/react-native";

type AlarmDebugEvent =
  | "delivered"
  | "dismissed"
  | "opened"
  | "schedule"
  | "schedule_failed"
  | "schedule_skipped"
  | "superseded"
  | "top_off";

interface AlarmDebugPayload {
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

export function logAlarmEvent(
  event: AlarmDebugEvent,
  payload: AlarmDebugPayload
): void {
  const message = {
    at: new Date().toISOString(),
    event,
    ...Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    ),
  };

  console.info("[alarm-debug]", JSON.stringify(message));
}

export function getAlarmDebugPayload(
  notification: Notification | undefined,
  source: string
): AlarmDebugPayload {
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
