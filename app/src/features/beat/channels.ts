import notifee, { AndroidImportance } from "@notifee/react-native";

export const CHANNEL_IDS = {
  whisper: "tempo-whisper",
  nudge: "tempo-nudge",
  pulse: "tempo-pulse",
  call: "tempo-call",
} as const;

export async function createNotificationChannels() {
  await notifee.createChannel({
    id: CHANNEL_IDS.whisper,
    name: "Whisper",
    description: "Silent notifications with vibration only",
    importance: AndroidImportance.LOW,
    vibration: true,
    vibrationPattern: [100, 100],
    sound: undefined,
  });

  await notifee.createChannel({
    id: CHANNEL_IDS.nudge,
    name: "Nudge",
    description: "Notifications with a short sound",
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [100, 100],
    sound: "default",
  });

  await notifee.createChannel({
    id: CHANNEL_IDS.pulse,
    name: "Pulse",
    description: "Full-screen alerts with sound",
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [200, 200],
    sound: "default",
  });

  await notifee.createChannel({
    id: CHANNEL_IDS.call,
    name: "Call",
    description: "Persistent alerts until dismissed",
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [500, 500, 200, 500],
    sound: "default",
  });
}
