# Tempo

Repeating alarm and productivity time-audit app for Android. Helps users build consistent habits by scheduling beats throughout the day within configurable time windows.

## Language

### Domain

**Rhythm**:
A named, repeating alarm configuration with a time window, interval, active days, and intensity.
_Avoid_: alarm, timer, schedule, reminder

**Beat**:
A single alarm instance produced by a rhythm at a specific timestamp.
_Avoid_: notification, alert, alarm instance

**Window**:
The active time range (start time to end time) for a rhythm on a given day. May cross midnight.
_Avoid_: time range, slot, period

**Intensity**:
The notification urgency level of a rhythm: whisper, nudge, pulse, call. Determines channel, sound, and whether the alarm goes full-screen.
_Avoid_: priority, level, severity

**Preset**:
A built-in rhythm template (Deep Work, Hydration, etc.) users can adopt.
_Avoid_: template, default

### Architecture

**RhythmRepository**:
Interface for rhythm persistence. Implementation backed by Drizzle + expo-sqlite.
_Avoid_: operations, data layer, DAO

**AlarmScheduler**:
Interface for scheduling and canceling beat notifications. Implementation backed by Notifee.
_Avoid_: engine, notification manager

**StatusNotifier**:
Interface for the persistent status notification showing upcoming beats. Implementation backed by Notifee.
_Avoid_: status bar, status manager

**Rhythm Store**:
UI-facing coordination layer. Every rhythm mutation goes through the store, which orchestrates repository, scheduler, status notifier, and atom state in one call. Background handlers bypass the store and call interfaces directly.
_Avoid_: state manager, controller, orchestrator

## Relationships

- A **Rhythm** produces many **Beats** across its **Windows**
- A **Beat** belongs to exactly one **Rhythm**
- A **Window** is computed from a **Rhythm**'s start time, end time, and active days
- A **Rhythm**'s **Intensity** determines which notification channel its **Beats** use
- The **Rhythm Store** coordinates **RhythmRepository**, **AlarmScheduler**, and **StatusNotifier**
- **AlarmScheduler** consumes **Rhythms** and schedules **Beats**
- **StatusNotifier** reads from **RhythmRepository** to build the notification model

## Example dialogue

> **Dev:** "When a user creates a new **Rhythm**, what happens?"
> **Domain expert:** "The **Rhythm Store** persists it via **RhythmRepository**, then tells **AlarmScheduler** to schedule the next **Beats**, then tells **StatusNotifier** to refresh so the persistent notification reflects the new **Rhythm**."

> **Dev:** "What if a **Beat** fires while the app is in the background?"
> **Domain expert:** "The event router handles it internally — it tells **AlarmScheduler** to top off the schedule with the next **Beat** for that **Rhythm**, and supersedes any older displayed notifications."

> **Dev:** "Does the **Rhythm Store** handle permissions?"
> **Domain expert:** "No. Permissions are a UI concern — `useRhythmEngine` gates on permissions before calling the store. The store assumes permission is already granted."

## Flagged ambiguities

- "engine" was used for both alarm scheduling (`engine.ts`) and the rhythm coordination hook (`useRhythmEngine`). Resolved: scheduling is **AlarmScheduler**, the hook stays as a thin permission gate.
- "operations" was used for the CRUD layer. Resolved: this is **RhythmRepository** — an interface with a Drizzle implementation behind it.
- "status" was overloaded between the notification display and the model building. Resolved: **StatusNotifier** is the interface (1 method: `sync`), status-model is a private implementation detail folded inside.
