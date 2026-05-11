import { syncStatusNotification } from "./status";
import type { StatusNotifier } from "./status-notifier";

export function createNotifeeStatusNotifier(): StatusNotifier {
  return {
    sync: syncStatusNotification,
  };
}
