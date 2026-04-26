import notifee from "@notifee/react-native";
import { beat, extractBeatPayload } from "@/lib/logger";
import { buildBeatEventRouter } from "./event-router";

/**
 * Register foreground event handler for Notifee.
 * Call once on app startup (inside React).
 */
export function registerNotificationHandlers() {
  notifee.onForegroundEvent(buildBeatEventRouter("foreground"));
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

  beat.info(
    "opened",
    extractBeatPayload(initial.notification, "initial-notification")
  );

  if (initial.notification?.id) {
    await notifee.cancelNotification(initial.notification.id);
  }
}
