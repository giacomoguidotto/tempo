import notifee, {
  AndroidCategory,
  AndroidVisibility,
  type TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import type { Rhythm } from "@/features/rhythm/schemas";
import { getUpcomingBeatDates } from "@/features/rhythm/time-range";
import { beat } from "@/lib/logger";
import { CHANNEL_IDS } from "./channels";
import { syncStatusNotification } from "./status";

const SCHEDULE_AHEAD_COUNT = 5;

export async function scheduleRhythm(
  rhythm: Rhythm,
  source = "manual"
): Promise<void> {
  // Cancel existing alarms for this rhythm first
  await cancelRhythm(rhythm.id);

  if (!rhythm.enabled) {
    await syncStatusNotification(source);
    return;
  }

  const nextBeats = getUpcomingBeatDates(rhythm, SCHEDULE_AHEAD_COUNT);
  if (nextBeats.length === 0) {
    beat.warn("schedule_skipped", {
      source,
      detail: "no-future-beats",
      rhythmId: rhythm.id,
      rhythmName: rhythm.name,
    });
    await syncStatusNotification(source);
    return;
  }

  const channelId = CHANNEL_IDS[rhythm.intensity];
  const isFullScreen =
    rhythm.intensity === "pulse" || rhythm.intensity === "call";

  for (const nextBeat of nextBeats) {
    const alarmInstanceId = `rhythm-${rhythm.id}-${nextBeat.getTime()}`;
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: nextBeat.getTime(),
      alarmManager: {
        allowWhileIdle: true,
      },
    };

    await notifee.createTriggerNotification(
      {
        id: alarmInstanceId,
        title: rhythm.name,
        body: formatTime(nextBeat),
        android: {
          channelId,
          category: AndroidCategory.ALARM,
          visibility: AndroidVisibility.PUBLIC,
          smallIcon: "ic_launcher",
          pressAction: { id: "default" },
          fullScreenAction: isFullScreen
            ? {
                id: "full-screen",
                launchActivity: "dev.guidotto.tempo.TempoAlarmActivity",
              }
            : undefined,
          autoCancel: false,
          ongoing: rhythm.intensity === "call",
          actions: [
            {
              title: "Dismiss",
              pressAction: { id: "dismiss" },
            },
          ],
        },
        data: {
          alarmInstanceId,
          rhythmId: rhythm.id,
          rhythmName: rhythm.name,
          intensity: rhythm.intensity,
          notificationId: alarmInstanceId,
          scheduledAt: nextBeat.toISOString(),
        },
      },
      trigger
    );
  }

  beat.info(source.includes("delivered") ? "top_off" : "schedule", {
    source,
    detail: nextBeats.map((beat) => beat.toISOString()).join(","),
    intensity: rhythm.intensity,
    pendingCount: nextBeats.length,
    rhythmId: rhythm.id,
    rhythmName: rhythm.name,
    scheduledAt: nextBeats[0]?.toISOString() ?? null,
  });
  await syncStatusNotification(source);
}

/**
 * Cancel all scheduled alarms for a rhythm.
 */
export async function cancelRhythm(rhythmId: string): Promise<void> {
  const notificationIds = await notifee.getTriggerNotificationIds();

  for (const notificationId of notificationIds) {
    if (notificationId.startsWith(`rhythm-${rhythmId}-`)) {
      await notifee.cancelNotification(notificationId);
    }
  }
}

/**
 * Schedule alarms for all enabled rhythms.
 */
export async function scheduleAllRhythms(rhythms: Rhythm[]): Promise<void> {
  for (const rhythm of rhythms) {
    await scheduleRhythm(rhythm, "schedule-all");
  }

  await syncStatusNotification("schedule-all");
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
