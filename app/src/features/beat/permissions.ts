import notifee, {
  AndroidNotificationSetting,
  AuthorizationStatus,
} from "@notifee/react-native";
import { Alert, Linking, Platform } from "react-native";

/**
 * Request all permissions needed for alarms to fire reliably.
 * Only prompts for permissions that haven't been granted yet.
 * Returns true if all critical permissions are granted.
 */
export async function requestAlarmPermissions(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();

  // 1. Notification permission (Android 13+)
  if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
    const result = await notifee.requestPermission();
    if (result.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
      Alert.alert(
        "Notifications Required",
        "Tempo needs notification permission to fire alarms.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
  }

  // 2. Exact alarm permission (Android 12+)
  if (
    Platform.OS === "android" &&
    settings.android.alarm !== AndroidNotificationSetting.ENABLED
  ) {
    await notifee.openAlarmPermissionSettings();
  }

  // 3. Full-screen intent permission (Android 14+)
  if (Platform.OS === "android") {
    const updated = await notifee.getNotificationSettings();
    const fsi = (updated.android as unknown as Record<string, unknown>)
      .fullScreenIntent;
    if (fsi !== undefined && fsi !== AndroidNotificationSetting.ENABLED) {
      await notifee.openNotificationSettings();
    }
  }

  return true;
}
