# Alarms

## Engine — Notifee

Notifee handles notifications, foreground services, and full-screen intents on Android. It replaces `expo-notifications` for alarm reliability.

## Intensity levels

| Level      | Name      | Vibration    | Sound            | Full-screen |
|------------|-----------|--------------|------------------|-------------|
| **Gentle** | Whisper   | Short pulse  | No               | No          |
| **Medium** | Nudge     | Short pulse  | Short sound      | No          |
| **Strong** | Pulse     | Short pulse  | Short sound      | Yes         |
| **Urgent** | Call      | Long vibrate | Persistent sound | Yes         |

All levels respect system sound mode. Config in `src/constants/tokens.ts`.

## Android permissions

Required in `app.json` and requested at runtime:
- `SCHEDULE_EXACT_ALARM` — exact alarm scheduling (Android 12+)
- `POST_NOTIFICATIONS` — show notifications (Android 13+)
- `FOREGROUND_SERVICE` — keep alarm engine alive
- `WAKE_LOCK` — wake device for alarm
- `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` — survive Doze mode
- `USE_FULL_SCREEN_INTENT` — Pulse/Call level alarms
- `RECEIVE_BOOT_COMPLETED` — reschedule alarms after reboot

## Full-screen alarm

The alarm dismiss screen (`src/app/alarm.tsx`) is a root-level fullscreen modal outside the tab navigator. Notifee's full-screen intent launches it directly.
