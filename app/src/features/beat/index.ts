import { createNotifeeAlarmScheduler } from "./notifee-alarm-scheduler";
import { createNotifeeStatusNotifier } from "./notifee-status-notifier";

export type { AlarmPayload, AlarmScheduler } from "./alarm-scheduler";
export type { StatusNotifier } from "./status-notifier";

export const alarmScheduler = createNotifeeAlarmScheduler();
export const statusNotifier = createNotifeeStatusNotifier();
