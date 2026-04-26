import type { DisplayedNotification } from "@notifee/react-native";
import { describe, expect, it } from "vitest";
import type { AlarmLaunchPayload } from "../../modules/tempo-alarm";
import {
  type AlarmPayloadSources,
  resolveAlarmPayload,
} from "./resolve-payload";

const EMPTY_PAYLOAD: AlarmLaunchPayload = {
  alarmInstanceId: null,
  intensity: null,
  notificationId: null,
  rhythmId: null,
  rhythmName: null,
  scheduledAt: null,
};

function makeDisplayed(
  notification: DisplayedNotification["notification"]
): DisplayedNotification {
  return { notification } as DisplayedNotification;
}

function makeSources(
  overrides: Partial<AlarmPayloadSources> = {}
): AlarmPayloadSources {
  return {
    props: {},
    native: { ...EMPTY_PAYLOAD },
    initialNotification: null,
    displayedNotifications: [],
    ...overrides,
  };
}

describe("resolveAlarmPayload", () => {
  it("returns all nulls when every source is empty", () => {
    expect(resolveAlarmPayload(makeSources())).toEqual(EMPTY_PAYLOAD);
  });

  it("prefers props over all other sources", () => {
    const result = resolveAlarmPayload(
      makeSources({
        props: { rhythmName: "from-props" },
        native: { ...EMPTY_PAYLOAD, rhythmName: "from-native" },
        initialNotification: {
          notification: { data: { rhythmName: "from-initial" } },
          pressAction: { id: "default" },
        },
      })
    );
    expect(result.rhythmName).toBe("from-props");
  });

  it("falls back to native when props are absent", () => {
    const result = resolveAlarmPayload(
      makeSources({
        native: {
          ...EMPTY_PAYLOAD,
          rhythmId: "native-id",
          intensity: "pulse",
        },
      })
    );
    expect(result.rhythmId).toBe("native-id");
    expect(result.intensity).toBe("pulse");
  });

  it("falls back to initial notification when props and native are absent", () => {
    const result = resolveAlarmPayload(
      makeSources({
        initialNotification: {
          notification: {
            id: "notif-123",
            data: {
              rhythmId: "initial-rhythm",
              rhythmName: "Focus",
              intensity: "nudge",
              scheduledAt: "2026-04-26T09:00:00.000Z",
              alarmInstanceId: "instance-abc",
            },
          },
          pressAction: { id: "default" },
        },
      })
    );
    expect(result.rhythmId).toBe("initial-rhythm");
    expect(result.rhythmName).toBe("Focus");
    expect(result.intensity).toBe("nudge");
    expect(result.notificationId).toBe("notif-123");
    expect(result.alarmInstanceId).toBe("instance-abc");
    expect(result.scheduledAt).toBe("2026-04-26T09:00:00.000Z");
  });

  it("falls back to latest displayed notification as last resort", () => {
    const result = resolveAlarmPayload(
      makeSources({
        displayedNotifications: [
          makeDisplayed({
            id: "displayed-1",
            data: {
              rhythmId: "displayed-rhythm",
              rhythmName: "Hydrate",
              intensity: "whisper",
              scheduledAt: "2026-04-26T10:00:00.000Z",
            },
          }),
        ],
      })
    );
    expect(result.rhythmId).toBe("displayed-rhythm");
    expect(result.rhythmName).toBe("Hydrate");
    expect(result.notificationId).toBe("displayed-1");
    expect(result.alarmInstanceId).toBe("displayed-1");
  });

  it("picks the most recently scheduled displayed notification", () => {
    const result = resolveAlarmPayload(
      makeSources({
        displayedNotifications: [
          makeDisplayed({
            id: "older",
            data: {
              rhythmName: "Older",
              scheduledAt: "2026-04-26T08:00:00.000Z",
            },
          }),
          makeDisplayed({
            id: "newer",
            data: {
              rhythmName: "Newer",
              scheduledAt: "2026-04-26T12:00:00.000Z",
            },
          }),
        ],
      })
    );
    expect(result.rhythmName).toBe("Newer");
    expect(result.notificationId).toBe("newer");
  });

  it("resolves each field independently from different sources", () => {
    const result = resolveAlarmPayload(
      makeSources({
        props: { rhythmName: "from-props" },
        native: { ...EMPTY_PAYLOAD, intensity: "call" },
        initialNotification: {
          notification: {
            id: "notif-456",
            data: { rhythmId: "from-initial" },
          },
          pressAction: { id: "default" },
        },
      })
    );
    expect(result.rhythmName).toBe("from-props");
    expect(result.intensity).toBe("call");
    expect(result.rhythmId).toBe("from-initial");
    expect(result.notificationId).toBe("notif-456");
  });
});
