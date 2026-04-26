import notifee from "@notifee/react-native";
import { buildBeatEventRouter } from "./event-router";

/**
 * Register background event handler for Notifee.
 * MUST be called at the app entry point (index.js), outside React.
 */
export function registerBackgroundHandler() {
  notifee.onBackgroundEvent(buildBeatEventRouter("background"));
}
