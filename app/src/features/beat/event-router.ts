import notifee, { type Event, EventType } from "@notifee/react-native";
import { beat, extractBeatPayload } from "@/lib/logger";
import { disableRhythmFromStatusNotification } from "./commands";
import { supersedeOlderNotifications, topOffRhythmSchedule } from "./runtime";
import {
  getStatusNotificationActionId,
  isStatusNotification,
  syncStatusNotification,
} from "./status";

/**
 * Build the shared notification event handler.
 * Context determines the source prefix used in logs ("foreground" or "background").
 */
export function buildBeatEventRouter(
  context: "foreground" | "background"
): (event: Event) => Promise<void> {
  return async ({ type, detail }: Event) => {
    if (isStatusNotification(detail.notification)) {
      if (
        type === EventType.ACTION_PRESS &&
        detail.pressAction?.id === getStatusNotificationActionId()
      ) {
        await disableRhythmFromStatusNotification(
          detail.notification?.data?.primaryRhythmId as string | undefined,
          `${context}-status-disable`
        );
      }
      if (type === EventType.DISMISSED) {
        await syncStatusNotification(`${context}-status-dismissed`);
      }
      return;
    }

    const rhythmId = detail.notification?.data?.rhythmId as string | undefined;
    const payload = extractBeatPayload(detail.notification, context);

    if (type === EventType.DELIVERED && rhythmId) {
      beat.info("delivered", payload);
      await supersedeOlderNotifications(
        rhythmId,
        detail.notification?.id,
        `${context}-supersede`
      );
      await topOffRhythmSchedule(rhythmId, `${context}-delivered`);
      return;
    }

    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === "dismiss"
    ) {
      beat.info("dismissed", {
        ...payload,
        source: `${context}-action-dismiss`,
      });
      await notifee.cancelNotification(detail.notification?.id ?? "");
      return;
    }

    if (type === EventType.DISMISSED) {
      beat.info("dismissed", {
        ...payload,
        source: `${context}-swipe`,
      });
      return;
    }

    if (type === EventType.PRESS) {
      beat.info("opened", {
        ...payload,
        source: `${context}-press`,
      });
    }
  };
}
