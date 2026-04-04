import notifee, { EventType } from "@notifee/react-native";

/**
 * Register background event handler for Notifee.
 * MUST be called at the app entry point (index.js), outside React.
 */
export function registerBackgroundHandler() {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const rhythmId = detail.notification?.data?.rhythmId as string | undefined;

    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === "dismiss" &&
      rhythmId
    ) {
      await notifee.cancelNotification(detail.notification?.id ?? "");
      // Can't reschedule here reliably — the DB may not be initialized.
      // The app will reschedule all rhythms on next mount.
    }

    if (type === EventType.PRESS && rhythmId) {
      // App will open — foreground handler takes over
      await notifee.cancelNotification(detail.notification?.id ?? "");
    }
  });
}
