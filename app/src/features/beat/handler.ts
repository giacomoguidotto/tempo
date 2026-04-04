import notifee, { EventType } from "@notifee/react-native";
import { router } from "expo-router";
import { getRhythm } from "@/features/rhythm/operations";
import { scheduleRhythm } from "./engine";

/**
 * Register foreground and background event handlers for Notifee.
 * Call once on app startup.
 */
export function registerNotificationHandlers() {
  // Foreground events
  notifee.onForegroundEvent(async ({ type, detail }) => {
    const rhythmId = detail.notification?.data?.rhythmId as string | undefined;

    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === "dismiss" &&
      rhythmId
    ) {
      await notifee.cancelNotification(detail.notification?.id ?? "");
      await rescheduleNext(rhythmId);
    }

    if (type === EventType.PRESS) {
      if (
        detail.notification?.data?.intensity === "pulse" ||
        detail.notification?.data?.intensity === "call"
      ) {
        router.push("/alarm");
      }
      if (rhythmId) {
        await rescheduleNext(rhythmId);
      }
    }
  });
}

async function rescheduleNext(rhythmId: string) {
  const rhythm = getRhythm(rhythmId);
  if (rhythm?.enabled) {
    await scheduleRhythm(rhythm);
  }
}
