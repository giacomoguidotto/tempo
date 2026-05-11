# Alarms

Alarm labels, states, and transitions should make sense to someone at 10pm, not just to the implementation.

## Engine — Notifee (archived)

Notifee handles notifications, foreground services, and full-screen intents on Android. The repository was archived in April 2026 — a migration to an alternative is pending.

Register `onBackgroundEvent` at the app entry point in `app/index.js`, outside React. If registered inside a `useEffect`, Android wake-from-killed-state fails with `No task registered for key app.notifee.notification-event`.

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
- `USE_EXACT_ALARM` — exact alarm scheduling (auto-granted for alarm clock apps, Android 13+)
- `POST_NOTIFICATIONS` — show notifications (Android 13+)
- `FOREGROUND_SERVICE` — keep alarm engine alive
- `WAKE_LOCK` — wake device for alarm
- `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` — survive Doze mode
- `USE_FULL_SCREEN_INTENT` — Pulse/Call level alarms
- `RECEIVE_BOOT_COMPLETED` — reschedule alarms after reboot

## Full-screen alarm

The alarm dismiss screen (`src/app/alarm.tsx`) is a root-level fullscreen modal outside the tab navigator. Notifee's full-screen intent launches it directly.

Three pieces are required together: `fullScreenAction` in the notification config, `showWhenLocked` and `turnScreenOn` on `MainActivity` via `plugins/with-alarm-activity.js`, and a `USE_FULL_SCREEN_INTENT` permission check on Android 14+.

When the app opens from a notification intent, use `notifee.getInitialNotification()` on mount to determine the launch source and route accordingly.
