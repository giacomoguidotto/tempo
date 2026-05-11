import notifee from "@notifee/react-native";
import { resolveAlarmPayload } from "@/alarm/resolve-payload";
import TempoAlarmModule from "../../../modules/tempo-alarm";
import type { AlarmPayload, AlarmScheduler } from "./alarm-scheduler";
import { cancelRhythm, scheduleAllRhythms, scheduleRhythm } from "./engine";

export function createNotifeeAlarmScheduler(): AlarmScheduler {
  return {
    schedule: scheduleRhythm,
    cancel: cancelRhythm,
    scheduleAll: scheduleAllRhythms,

    async cancelAll(): Promise<void> {
      await notifee.cancelAllNotifications();
      await notifee.cancelTriggerNotifications();
    },

    async dismiss(notificationId: string): Promise<void> {
      await notifee.cancelNotification(notificationId);
    },

    async resolveInitialAlarm(): Promise<AlarmPayload | null> {
      const native = TempoAlarmModule.getInitialAlarmPayload();
      const initialNotification = await notifee.getInitialNotification();
      const displayedNotifications = await notifee.getDisplayedNotifications();

      const resolved = resolveAlarmPayload({
        props: {},
        native,
        initialNotification,
        displayedNotifications,
      });

      if (!(resolved.rhythmId || resolved.alarmInstanceId)) {
        return null;
      }

      return resolved;
    },
  };
}
