# Alarm Reliability Checklist

Use this checklist to validate Tempo's alarm behavior on a physical Android device.

## When to run it

Primary pass:
- after a production build
- on a real Android device
- with a fresh app install when possible

Useful follow-up passes:
- after any alarm engine or permission flow change
- after Notifee, Expo, React Native, or Android target SDK upgrades

## Test setup

1. Install the production build.
2. Remove any existing rhythms.
3. Create short test rhythms with a 1-minute interval so failures are visible quickly.
4. Keep structured logs running:

```sh
# All Tempo logs
adb logcat | rg "tempo"

# Beat domain only (scheduling, delivery, status)
adb logcat | rg "tempo:beat"

# Rhythm domain only (CRUD operations)
adb logcat | rg "tempo:rhythm"
```

## Baseline fixtures

Prepare these rhythms before running the checklist:

- `Nudge Daytime`: today, active now, `Nudge`, 1-minute interval
- `Pulse Daytime`: today, active now, `Pulse`, 1-minute interval
- `Pulse Overnight`: start later than end, `Pulse`, 1-minute interval

## Checklist

### Permission flow

- [ ] Fresh install: creating or enabling a `Pulse` rhythm asks for the required permissions only when needed.
- [ ] Denying notification permission prevents Tempo from pretending the rhythm is fully armed.
- [ ] Denying exact alarm access prevents Tempo from pretending the rhythm is fully armed.
- [ ] Denying full-screen intent access prevents Tempo from pretending `Pulse` is fully armed.
- [ ] After granting missing permissions in system settings, returning to the app allows the rhythm to be armed successfully.

### Delivery contexts

- [ ] `Nudge Daytime` fires while the app is open in the foreground.
- [ ] `Pulse Daytime` fires while the app is backgrounded.
- [ ] `Pulse Daytime` still fires after the app is removed from recents.
- [ ] `Pulse Daytime` can take over the screen when the device is locked and full-screen permission is granted.
- [ ] `Pulse Daytime` still fires with battery saver enabled on the test device.

### Repeat-chain integrity

- [ ] Letting a delivered notification sit in the tray does not block the next beat.
- [ ] Swiping a delivered notification away does not block the next beat.
- [ ] Pressing the dismiss action does not block the next beat.
- [ ] Opening the notification does not block the next beat.
- [ ] When a newer beat from the same rhythm is delivered, older displayed notifications from that rhythm disappear from the tray.

### Schedule correctness

- [ ] A daytime rhythm fires only inside its configured window.
- [ ] An overnight rhythm with `startTime > endTime` keeps firing across midnight.
- [ ] Editing a rhythm reschedules future beats with the new values.
- [ ] Disabling a rhythm stops future beats.
- [ ] Deleting a rhythm removes its future beats.
- [ ] Reordering rhythms does not change delivery behavior.

### Guard and settings regressions

- [ ] Lowering the `Pulse` notification channel importance in Android settings makes the app reflect that the rhythm is not healthy enough for full-screen behavior.
- [ ] Revoking a required permission after a rhythm already exists is surfaced clearly the next time the rhythm is enabled or edited.

### Observability

- [ ] `adb logcat | rg "tempo:beat"` shows `delivered` entries for fired beats.
- [ ] Interacting with a notification produces `opened` or `dismissed` events with `level: "info"`.
- [ ] Superseding an older notification produces a `superseded` event.
- [ ] Delivery top-off behavior produces `top_off` schedule continuation logs.
- [ ] No `schedule_failed` events (level `"error"`) appear during a clean pass.
- [ ] Creating, editing, deleting, and toggling rhythms produce `[tempo:rhythm]` events.
- [ ] Status notification sync produces `status_sync` events with `rhythmCount`.

## Release sign-off

Record the result of the pass before shipping:

- Build tested:
- Device and Android version:
- Battery saver on/off:
- Full-screen intent granted:
- Failures found:
- Follow-up fixes needed:
