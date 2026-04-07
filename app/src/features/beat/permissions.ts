import notifee, {
  AndroidNotificationSetting,
  AuthorizationStatus,
} from "@notifee/react-native";
import { Linking, Platform } from "react-native";
import {
  canUseFullScreenIntent,
  openFullScreenIntentSettings,
} from "./full-screen-intent";

interface RequestAlarmPermissionsOptions {
  presentPrompt: (options: SettingsPromptOptions) => Promise<boolean>;
  requireFullScreen?: boolean;
}

interface SettingsPromptOptions {
  message: string;
  title: string;
}

/**
 * Request all permissions needed for alarms to fire reliably.
 * Only prompts for permissions that haven't been granted yet.
 * Returns true if all critical permissions are granted.
 */
export async function requestAlarmPermissions(
  options: RequestAlarmPermissionsOptions
): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();

  // 1. Notification permission (Android 13+)
  if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
    const result = await notifee.requestPermission();
    if (result.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
      const shouldOpenSettings = await options.presentPrompt({
        title: "Notifications Required",
        message: "Tempo needs notification permission to fire alarms.",
      });
      if (shouldOpenSettings) {
        await Linking.openSettings();
      }
      return false;
    }
  }

  // 2. Exact alarm permission (Android 12+)
  if (
    Platform.OS === "android" &&
    settings.android.alarm !== AndroidNotificationSetting.ENABLED
  ) {
    await promptForSettings(
      options.presentPrompt,
      "Exact Alarms Required",
      "Tempo needs exact alarm access so Pulse and Call rhythms fire at the scheduled time.",
      () => notifee.openAlarmPermissionSettings()
    );
    return false;
  }

  // 3. Full-screen intent permission (Android 14+) for Pulse/Call alarms
  if (
    options.requireFullScreen &&
    Platform.OS === "android" &&
    Platform.Version >= 34 &&
    !(await canUseFullScreenIntent())
  ) {
    await promptForSettings(
      options.presentPrompt,
      "Full-Screen Alerts Required",
      "Pulse and Call rhythms need full-screen alert access on Android 14+ so the alarm screen can open over the lock screen. If Tempo opens the app settings page instead, go to Special app access and allow full-screen alerts for Tempo.",
      () => openFullScreenIntentSettings()
    );
    return false;
  }

  return true;
}

async function promptForSettings(
  presentPrompt: (options: SettingsPromptOptions) => Promise<boolean>,
  title: string,
  message: string,
  openSettings: () => Promise<void>
): Promise<void> {
  const shouldOpenSettings = await presentPrompt({ title, message });
  if (shouldOpenSettings) {
    await openSettings();
  }
}
