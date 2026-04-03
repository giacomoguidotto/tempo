import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { Alert, Linking, Platform } from "react-native";

/**
 * Request all permissions needed for alarms to fire reliably.
 * Returns true if all critical permissions are granted.
 */
export async function requestAlarmPermissions(): Promise<boolean> {
  // 1. Notification permission (Android 13+)
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
    Alert.alert(
      "Notifications Required",
      "Tempo needs notification permission to fire alarms. Please enable it in Settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }

  // 2. Exact alarm permission (Android 12+)
  if (Platform.OS === "android") {
    const exactAlarmSettings = await notifee.getNotificationSettings();
    if (exactAlarmSettings.android.alarm !== AuthorizationStatus.AUTHORIZED) {
      await notifee.openAlarmPermissionSettings();
    }
  }

  // 3. Battery optimization exemption
  if (Platform.OS === "android") {
    const batteryOptimized = await notifee.isBatteryOptimizationEnabled();
    if (batteryOptimized) {
      await notifee.openBatteryOptimizationSettings();
    }
  }

  return true;
}

/**
 * Check if all permissions are granted without prompting.
 */
export async function checkAlarmPermissions(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();

  if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
    return false;
  }

  if (
    Platform.OS === "android" &&
    settings.android.alarm !== AuthorizationStatus.AUTHORIZED
  ) {
    return false;
  }

  return true;
}
