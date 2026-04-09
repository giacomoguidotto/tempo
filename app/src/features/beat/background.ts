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
 * Register background event handler for Notifee.
 * MUST be called at the app entry point (index.js), outside React.
 */
export function registerBackgroundHandler() {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (isStatusNotification(detail.notification)) {
      if (
        type === EventType.ACTION_PRESS &&
        detail.pressAction?.id === getStatusNotificationActionId()
      ) {
        await disableRhythmFromStatusNotification(
          detail.notification?.data?.primaryRhythmId as string | undefined,
          "background-status-disable"
        );
      }
      if (type === EventType.DISMISSED) {
        await syncStatusNotification("background-status-dismissed");
      }
      return;
    }

    const rhythmId = detail.notification?.data?.rhythmId as string | undefined;
    const payload = getAlarmDebugPayload(detail.notification, "background");

    if (type === EventType.DELIVERED && rhythmId) {
      logAlarmEvent("delivered", payload);
      await supersedeOlderNotifications(
        rhythmId,
        detail.notification?.id,
        "background-supersede"
      );
      await topOffRhythmSchedule(rhythmId, "background-delivered");
      return;
    }

    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === "dismiss"
    ) {
      logAlarmEvent("dismissed", {
        ...payload,
        source: "background-action-dismiss",
      });
      await notifee.cancelNotification(detail.notification?.id ?? "");
      return;
    }

    if (type === EventType.DISMISSED) {
      logAlarmEvent("dismissed", {
        ...payload,
        source: "background-swipe",
      });
      return;
    }

    if (type === EventType.PRESS) {
      logAlarmEvent("opened", {
        ...payload,
        source: "background-press",
      });
    }
  });
}
