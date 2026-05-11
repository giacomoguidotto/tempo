# Architecture

```mermaid
graph TD
    classDef iface fill:#2D4F3E,stroke:#4A8C6F,color:#E0F0E8
    classDef impl fill:#3D2E1F,stroke:#7A6040,color:#E8D8C8
    classDef store fill:#2E3A4F,stroke:#5A7A9F,color:#D8E8F8
    classDef ui fill:#3D3525,stroke:#8A7A5A,color:#F0E8D0
    classDef infra fill:#2A2A2A,stroke:#555,color:#CCC
    classDef platform fill:#1A1A2E,stroke:#444,color:#AAA

    %% ─── UI Layer ──────────────────────────────────────────
    subgraph UI["UI Screens"]
        tabsIndex["(tabs)/index.tsx"]:::ui
        settings["settings.tsx"]:::ui
        alarm["alarm.tsx"]:::ui
        alarmRoot["alarm-root.tsx"]:::ui
        rhythmId["rhythm/[id].tsx"]:::ui
        rhythmSheet["rhythm-sheet.tsx"]:::ui
        useEngine["useRhythmEngine"]:::ui
    end

    %% ─── Store ─────────────────────────────────────────────
    subgraph Store["store/"]
        rhythmStore["rhythm.ts\nhydrate · create · update\ntoggle · delete · reorder"]:::store
    end

    %% ─── Rhythm Module ─────────────────────────────────────
    subgraph Rhythm["features/rhythm/"]
        direction TB
        rhythmIndex["index.ts\n‹singleton›"]:::iface
        rhythmRepo["repository.ts\n‹interface›"]:::iface
        drizzleRepo["drizzle-repository.ts"]:::impl
        operations["operations.ts"]:::impl
        schemas["schemas.ts"]:::impl
        timeRange["time-range.ts"]:::impl
        atoms["store/atoms.ts\nrhythmsAtom"]:::impl
    end

    %% ─── Beat Module ───────────────────────────────────────
    subgraph Beat["features/beat/ — Notifee boundary"]
        direction TB
        beatIndex["index.ts\n‹singletons›"]:::iface
        alarmSched["alarm-scheduler.ts\n‹interface›"]:::iface
        statusNotif["status-notifier.ts\n‹interface›"]:::iface
        notifeeAlarm["notifee-alarm-scheduler.ts"]:::impl
        notifeeStatus["notifee-status-notifier.ts"]:::impl

        subgraph Internals["Notifee-coupled internals"]
            engine["engine.ts\nschedule · cancel"]:::impl
            status["status.ts\nsync · refresh"]:::impl
            statusModel["status-model.ts"]:::impl
            runtime["runtime.ts\ntopOff · supersede"]:::impl
            eventRouter["event-router.ts\nbuildBeatEventRouter"]:::impl
            channels["channels.ts"]:::impl
            permissions["permissions.ts"]:::impl
            background["background.ts"]:::impl
        end
    end

    %% ─── Infrastructure ────────────────────────────────────
    subgraph Infra["lib/"]
        db["db.ts"]:::infra
        schema["schema.ts"]:::infra
        logger["logger.ts"]:::infra
        storage["storage.ts"]:::infra
    end

    subgraph Platform["Platform"]
        notifee["@notifee/react-native"]:::platform
        drizzle["Drizzle + expo-sqlite"]:::platform
        jotai["Jotai"]:::platform
        nativeModule["TempoAlarmModule"]:::platform
        resolvePayload["alarm/resolve-payload.ts"]:::platform
    end

    %% ─── UI → Hook → Store (foreground mutation path) ───────
    tabsIndex --> useEngine
    useEngine -->|"toggle · delete\nreorder · hydrate"| rhythmStore
    rhythmSheet -->|"create · update\ndelete"| rhythmStore
    settings -->|"deleteAll"| rhythmStore

    %% ─── UI → Interfaces (reads + alarm screens) ──────────
    useEngine -.->|"reads"| atoms
    rhythmId -->|"get"| rhythmIndex
    alarm -->|"cancelAll"| beatIndex
    alarmRoot -->|"dismiss\nresolveInitialAlarm"| beatIndex

    %% ─── UI → Permissions (interactive, not in store) ──────
    useEngine -->|"gate"| permissions
    rhythmSheet -->|"gate"| permissions

    %% ─── Store → Interfaces (orchestration) ────────────────
    rhythmStore -->|"getAll · create\nupdate · toggle\ndelete · reorder"| rhythmIndex
    rhythmStore -->|"schedule · cancel\nscheduleAll · cancelAll"| beatIndex
    rhythmStore -->|"sync"| beatIndex
    rhythmStore -.->|"set"| atoms

    %% ─── Rhythm: interface → implementation ────────────────
    rhythmIndex --> drizzleRepo
    drizzleRepo --> operations
    operations --> db
    operations --> schema
    drizzleRepo --> db
    drizzleRepo --> schema

    %% ─── Beat: interface → implementation ──────────────────
    beatIndex --> notifeeAlarm
    beatIndex --> notifeeStatus
    notifeeAlarm --> engine
    notifeeAlarm --> resolvePayload
    notifeeAlarm --> nativeModule
    notifeeStatus --> status

    %% ─── Beat internals ────────────────────────────────────
    engine --> notifee
    engine --> channels
    engine --> status
    engine --> timeRange
    status --> notifee
    status --> channels
    status --> statusModel
    status --> rhythmIndex
    statusModel --> timeRange
    runtime --> engine
    runtime --> rhythmIndex
    runtime --> notifee

    %% ─── Background path (bypasses store) ──────────────────
    background -->|"registers"| eventRouter
    eventRouter -->|"bypass store"| rhythmIndex
    eventRouter --> engine
    eventRouter --> runtime
    eventRouter --> status

    %% ─── Infrastructure ────────────────────────────────────
    db --> drizzle
    atoms --> jotai
    rhythmStore --> jotai
    permissions --> notifee
    channels --> notifee
```

## Reading the diagram

**Green nodes** are public interfaces — the narrow seam. Callers outside a module only touch these.

**Brown nodes** are implementations hidden behind the interface. Swapping Notifee means rewriting these inside `features/beat/`, nothing outside changes.

**Blue node** is the store — the single coordination point for UI mutations. It orchestrates repository, scheduler, status notifier, and atom state in one call.

**Gold nodes** are UI screens and hooks. They reach the system through the store (mutations) or through interfaces directly (reads, alarm screen actions).

### Two entry paths

| Path | Goes through | Example |
|---|---|---|
| **Foreground (UI)** | `useRhythmEngine` / `rhythm-sheet` → `rhythmStore` → interfaces | User toggles a rhythm |
| **Background** | `background.ts` → `event-router` → interfaces directly | A beat fires while app is backgrounded |

Background handlers bypass the store to avoid circular dependencies — they call `rhythmRepository`, `engine`, and `status` directly.

### Notifee containment

Everything inside the dashed boundary imports `@notifee/react-native`. Nothing outside it does. On swap day, rewrite the internals of `features/beat/`, change two constructor calls in `index.ts`, done.
