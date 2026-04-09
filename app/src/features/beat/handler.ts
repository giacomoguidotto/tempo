import notifee, { EventType } from "@notifee/react-native";
import { disableRhythmFromStatusNotification } from "./commands";
import { getAlarmDebugPayload, logAlarmEvent } from "./debug";
import { supersedeOlderNotifications, topOffRhythmSchedule } from "./runtime";
import {
  getStatusNotificationActionId,
  isStatusNotification,
  syncStatusNotification,
} from "./status";

/**
 * Register foreground event handler for Notifee.
 * Call once on app startup (inside React).
 */
export function registerNotificationHandlers() {
  notifee.onForegroundEvent(async ({ type, detail }) => {
    if (isStatusNotification(detail.notification)) {
      if (
        type === EventType.ACTION_PRESS &&
        detail.pressAction?.id === getStatusNotificationActionId()
      ) {
        await disableRhythmFromStatusNotification(
          detail.notification?.data?.primaryRhythmId as string | undefined,
          "foreground-status-disable"
        );
      }
      if (type === EventType.DISMISSED) {
        await syncStatusNotification("foreground-status-dismissed");
      }
      return;
    }

    const rhythmId = detail.notification?.data?.rhythmId as string | undefined;
    const payload = getAlarmDebugPayload(detail.notification, "foreground");

    if (type === EventType.DELIVERED && rhythmId) {
      logAlarmEvent("delivered", payload);
      await supersedeOlderNotifications(
        rhythmId,
        detail.notification?.id,
        "foreground-supersede"
      );
      await topOffRhythmSchedule(rhythmId, "foreground-delivered");
      return;
    }

    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === "dismiss"
    ) {
      logAlarmEvent("dismissed", {
        ...payload,
        source: "foreground-action-dismiss",
      });
      await notifee.cancelNotification(detail.notification?.id ?? "");
      return;
    }

    if (type === EventType.DISMISSED) {
      logAlarmEvent("dismissed", {
        ...payload,
        source: "foreground-swipe",
      });
      return;
    }

    if (type === EventType.PRESS) {
      logAlarmEvent("opened", {
        ...payload,
        source: "foreground-press",
      });
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

  logAlarmEvent(
    "opened",
    getAlarmDebugPayload(initial.notification, "initial-notification")
  );

  if (initial.notification?.id) {
    await notifee.cancelNotification(initial.notification.id);
  }
}
