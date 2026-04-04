import notifee, { EventType } from "@notifee/react-native";
import { router } from "expo-router";
import { getRhythm } from "@/features/rhythm/operations";
import { scheduleRhythm } from "./engine";

/**
 * Register foreground event handler for Notifee.
 * Call once on app startup (inside React).
 */
export function registerNotificationHandlers() {
  notifee.onForegroundEvent(async ({ type, detail }) => {
    const rhythmId = detail.notification?.data?.rhythmId as string | undefined;
    const actionId = detail.pressAction?.id;

    // Dismiss button pressed
    if (type === EventType.ACTION_PRESS && actionId === "dismiss" && rhythmId) {
      await notifee.cancelNotification(detail.notification?.id ?? "");
      await rescheduleNext(rhythmId);
    }

    // Full-screen action (app was foregrounded by full-screen intent)
    if (type === EventType.ACTION_PRESS && actionId === "full-screen") {
      router.push("/alarm");
      if (rhythmId) {
        await rescheduleNext(rhythmId);
      }
    }

    // Notification tapped
    if (type === EventType.PRESS) {
      const intensity = detail.notification?.data?.intensity;
      if (intensity === "pulse" || intensity === "call") {
        router.push("/alarm");
      }
      if (rhythmId) {
        await rescheduleNext(rhythmId);
      }
    }
  });
}

/**
 * Check if app was launched by a notification (cold start from full-screen intent).
 * Call once after router is ready.
 */
export async function handleInitialNotification() {
  const initial = await notifee.getInitialNotification();
  if (!initial) {
    return;
  }

  const rhythmId = initial.notification?.data?.rhythmId as string | undefined;
  const intensity = initial.notification?.data?.intensity;

  // Navigate to alarm screen if launched from pulse/call
  if (intensity === "pulse" || intensity === "call") {
    router.push("/alarm");
  }

  // Cancel the notification and schedule next
  if (initial.notification?.id) {
    await notifee.cancelNotification(initial.notification.id);
  }
  if (rhythmId) {
    await rescheduleNext(rhythmId);
  }
}

async function rescheduleNext(rhythmId: string) {
  const rhythm = getRhythm(rhythmId);
  if (rhythm?.enabled) {
    await scheduleRhythm(rhythm);
  }
}
