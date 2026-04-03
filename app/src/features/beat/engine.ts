import notifee, {
  AndroidCategory,
  AndroidVisibility,
  type TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import type { Rhythm } from "@/features/rhythm/schemas";
import { CHANNEL_IDS } from "./channels";

/**
 * Compute the next N beat timestamps for a rhythm from now.
 */
export function computeNextBeats(rhythm: Rhythm, count = 1): Date[] {
  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const beats: Date[] = [];

  const [sh, sm] = rhythm.startTime.split(":").map(Number);
  const [eh, em] = rhythm.endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  // Check today and next 7 days
  for (let dayOffset = 0; dayOffset < 7 && beats.length < count; dayOffset++) {
    const day = (currentDay + dayOffset) % 7;
    if (!rhythm.days.includes(day)) {
      continue;
    }

    for (let t = startMin; t <= endMin; t += rhythm.intervalMinutes) {
      // Skip beats in the past for today
      if (dayOffset === 0 && t <= currentMinutes) {
        continue;
      }

      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      date.setHours(Math.floor(t / 60), t % 60, 0, 0);
      beats.push(date);

      if (beats.length >= count) {
        break;
      }
    }
  }

  return beats;
}

/**
 * Schedule the next alarm for a rhythm.
 */
export async function scheduleRhythm(rhythm: Rhythm): Promise<void> {
  // Cancel existing alarms for this rhythm first
  await cancelRhythm(rhythm.id);

  if (!rhythm.enabled) {
    return;
  }

  const nextBeats = computeNextBeats(rhythm, 1);
  if (nextBeats.length === 0) {
    return;
  }

  const nextBeat = nextBeats[0];
  const channelId = CHANNEL_IDS[rhythm.intensity];
  const isFullScreen =
    rhythm.intensity === "pulse" || rhythm.intensity === "call";

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: nextBeat.getTime(),
    alarmManager: {
      allowWhileIdle: true,
    },
  };

  await notifee.createTriggerNotification(
    {
      id: `rhythm-${rhythm.id}`,
      title: rhythm.name,
      body: formatTime(nextBeat),
      android: {
        channelId,
        category: AndroidCategory.ALARM,
        visibility: AndroidVisibility.PUBLIC,
        smallIcon: "ic_launcher",
        pressAction: { id: "default" },
        fullScreenAction: isFullScreen ? { id: "full-screen" } : undefined,
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
        rhythmId: rhythm.id,
        intensity: rhythm.intensity,
      },
    },
    trigger
  );
}

/**
 * Cancel all scheduled alarms for a rhythm.
 */
export async function cancelRhythm(rhythmId: string): Promise<void> {
  await notifee.cancelNotification(`rhythm-${rhythmId}`);
}

/**
 * Schedule alarms for all enabled rhythms.
 */
export async function scheduleAllRhythms(rhythms: Rhythm[]): Promise<void> {
  for (const rhythm of rhythms) {
    await scheduleRhythm(rhythm);
  }
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
