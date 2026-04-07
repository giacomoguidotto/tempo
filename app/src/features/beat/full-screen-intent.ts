import { Linking, Platform } from "react-native";
import TempoAlarmModule from "../../../modules/tempo-alarm";

export function canUseFullScreenIntent(): Promise<boolean> {
  if (Platform.OS !== "android" || Platform.Version < 34) {
    return Promise.resolve(true);
  }

  if (!TempoAlarmModule) {
    // Avoid blocking JS-only dev reloads when the native bridge is not present yet.
    return Promise.resolve(true);
  }

  return TempoAlarmModule.canUseFullScreenIntent();
}

export async function openFullScreenIntentSettings(): Promise<void> {
  if (Platform.OS !== "android" || Platform.Version < 34) {
    return;
  }

  if (!TempoAlarmModule) {
    await Linking.openSettings();
    return;
  }

  try {
    await TempoAlarmModule.openFullScreenIntentSettings();
  } catch {
    // Fallback for dev builds that do not have the native bridge linked yet.
    await Linking.openSettings();
  }
}
