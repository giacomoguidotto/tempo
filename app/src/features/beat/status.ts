import notifee, { AndroidStyle } from "@notifee/react-native";
import { beat } from "@/lib/logger";
import { CHANNEL_IDS } from "./channels";
import {
  buildStatusNotificationModel,
  getStatusRhythmCandidates,
} from "./status-model";

const STATUS_NOTIFICATION_ID = "tempo-status";
const STATUS_DISABLE_ACTION_ID = "status-disable";
const STATUS_NOTIFICATION_KIND = "status";

/** Self-scheduling refresh: keeps the "Next in X min" countdown fresh. */
let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

function scheduleRefresh() {
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
  const msToNextMinute =
    (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds() + 500;
  refreshTimerId = setTimeout(() => {
    refreshTimerId = null;
    syncStatusNotification("refresh").catch(() => undefined);
  }, msToNextMinute);
}

function cancelRefresh() {
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}

export function getStatusNotificationActionId(): string {
  return STATUS_DISABLE_ACTION_ID;
}

export function isStatusNotification(
  notification: { data?: Record<string, unknown> } | undefined
): boolean {
  return notification?.data?.notificationKind === STATUS_NOTIFICATION_KIND;
}

export async function syncStatusNotification(source = "manual"): Promise<void> {
  const model = buildStatusNotificationModel(getStatusRhythmCandidates());

  if (!model) {
    beat.info("status_cancel", { source });
    cancelRefresh();
    await notifee.cancelNotification(STATUS_NOTIFICATION_ID);
    return;
  }

  await notifee.displayNotification({
    id: STATUS_NOTIFICATION_ID,
    title: model.title,
    body: model.body,
    android: {
      channelId: CHANNEL_IDS.status,
      smallIcon: "ic_launcher",
      pressAction: { id: "default" },
      actions: [
        {
          title: "Disable",
          pressAction: { id: STATUS_DISABLE_ACTION_ID },
        },
      ],
      autoCancel: false,
      ongoing: true,
      onlyAlertOnce: true,
      style: {
        type: AndroidStyle.INBOX,
        lines: model.lines,
      },
    },
    data: {
      notificationKind: STATUS_NOTIFICATION_KIND,
      primaryRhythmId: model.primaryRhythmId,
      source,
    },
  });

  beat.info("status_sync", {
    source,
    rhythmCount: getStatusRhythmCandidates().length,
  });
  scheduleRefresh();
}
