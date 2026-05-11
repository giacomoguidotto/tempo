# Vertical deep modules with narrow seam

We're restructuring the app around vertical deep modules — each module owns its full depth from interface to platform dependency, rather than horizontal layers (repository layer, service layer, etc.). Three interfaces (RhythmRepository, AlarmScheduler, StatusNotifier) define the module boundaries. Implementations are wired as module-level singletons, not React context. A centralized rhythm store (`src/store/`) orchestrates all three interfaces plus Jotai atom state, giving UI callers a single entry point per mutation. Background handlers bypass the store and call interfaces directly to avoid circular dependencies.

## Considered options

**Wide seam (full notification provider abstraction):** A single NotificationProvider interface covering channels, event routing, background registration, scheduling, display, and permissions. Rejected because the replacement library will have a fundamentally different event model — the abstraction would either leak or lose platform capabilities. On swap day you rewrite `features/beat/` internals regardless.

**Narrow seam + fix leaks (chosen):** AlarmScheduler and StatusNotifier cover the business-logic-facing surface. Infrastructure files (channels, event routing, background handlers) stay Notifee-coupled inside `features/beat/`. The 3 files outside the folder that import Notifee directly (alarm.tsx, alarm-root.tsx, settings.tsx) get routed through the interfaces. On swap day, you rewrite the folder internals; the interface holds.

**React context for DI:** Rejected. One app, one implementation per interface. Context providers add ceremony to every call site (hook call, provider nesting) to solve a problem that happens once (swap day). Module singletons give the same swappability — change one constructor call.

**Jotai write atoms for the store:** Rejected. Write atoms scatter mutation logic across atom definitions, hurting legibility. A plain module with named functions reads like what it is. It also works from background handlers outside React, which write atoms cannot.

## Consequences

- Notifee can be swapped by writing new implementations of AlarmScheduler and StatusNotifier, changing two constructor calls in `features/beat/index.ts`, and rewriting the internal infrastructure files. No code outside `features/beat/` changes.
- The store assumes permission is granted — `useRhythmEngine` survives as a thin hook that gates on permissions before calling store mutations. This separation means the store is callable from non-UI contexts.
- Interface and implementation live in separate files (`alarm-scheduler.ts` vs `notifee-alarm-scheduler.ts`) so the interface is a physical boundary, not just a type annotation.
