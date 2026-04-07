import notifee from "@notifee/react-native";
import { getRhythm } from "@/features/rhythm/operations";
import { getAlarmDebugPayload, logAlarmEvent } from "./debug";
import { scheduleRhythm } from "./engine";

export async function topOffRhythmSchedule(
  rhythmId: string,
  source: string
): Promise<void> {
  const rhythm = getRhythm(rhythmId);

  if (!rhythm) {
    logAlarmEvent("schedule_skipped", {
      source,
      detail: "rhythm-not-found",
      rhythmId,
    });
    return;
  }

  if (!rhythm.enabled) {
    logAlarmEvent("schedule_skipped", {
      source,
      detail: "rhythm-disabled",
      rhythmId,
      rhythmName: rhythm.name,
    });
    return;
  }

  try {
    await scheduleRhythm(rhythm, source);
  } catch (error) {
    logAlarmEvent("schedule_failed", {
      source,
      detail: error instanceof Error ? error.message : String(error),
      rhythmId: rhythm.id,
      rhythmName: rhythm.name,
    });
    throw error;
  }
}

export async function supersedeOlderNotifications(
  rhythmId: string,
  currentNotificationId: string | null | undefined,
  source: string
): Promise<void> {
  if (!currentNotificationId) {
    logAlarmEvent("schedule_skipped", {
      source,
      detail: "missing-current-notification-id",
      rhythmId,
    });
    return;
  }

  const displayed = await notifee.getDisplayedNotifications();

  for (const entry of displayed) {
    const notification = entry.notification;
    const notificationId = notification?.id;
    const displayedRhythmId = notification?.data?.rhythmId as
      | string
      | undefined;

    if (
      !notificationId ||
      notificationId === currentNotificationId ||
      displayedRhythmId !== rhythmId
    ) {
      continue;
    }

    await notifee.cancelNotification(notificationId);
    logAlarmEvent("superseded", {
      ...getAlarmDebugPayload(notification, source),
      detail: `superseded-by:${currentNotificationId}`,
    });
  }
}
