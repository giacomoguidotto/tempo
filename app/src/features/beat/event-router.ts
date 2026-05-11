import notifee, { type Event, EventType } from "@notifee/react-native";
import { rhythmRepository } from "@/features/rhythm";
import { beat, extractBeatPayload } from "@/lib/logger";
import { cancelRhythm } from "./engine";
import { supersedeOlderNotifications, topOffRhythmSchedule } from "./runtime";
import {
  getStatusNotificationActionId,
  isStatusNotification,
  syncStatusNotification,
} from "./status";

export function buildBeatEventRouter(
  context: "foreground" | "background"
): (event: Event) => Promise<void> {
  return async ({ type, detail }: Event) => {
    if (isStatusNotification(detail.notification)) {
      if (
        type === EventType.ACTION_PRESS &&
        detail.pressAction?.id === getStatusNotificationActionId()
      ) {
        const rhythmId = detail.notification?.data?.primaryRhythmId as
          | string
          | undefined;
        await disableRhythmFromStatus(rhythmId, `${context}-status-disable`);
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

async function disableRhythmFromStatus(
  rhythmId: string | undefined,
  source: string
): Promise<void> {
  if (!rhythmId) {
    beat.warn("schedule_skipped", { source, detail: "missing-rhythm-id" });
    await syncStatusNotification(source);
    return;
  }

  const rhythm = rhythmRepository.get(rhythmId);
  if (!rhythm) {
    beat.warn("schedule_skipped", {
      source,
      detail: "rhythm-not-found",
      rhythmId,
    });
    await syncStatusNotification(source);
    return;
  }

  beat.info("dismissed", {
    source,
    rhythmId,
    rhythmName: rhythm.name,
    detail: "disabled-from-status",
  });
  rhythmRepository.toggle(rhythmId, false);
  await cancelRhythm(rhythmId);
  await syncStatusNotification(source);
}
