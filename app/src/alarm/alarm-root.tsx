import notifee from "@notifee/react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { logAlarmEvent } from "@/features/beat/debug";
import TempoAlarmModule, {
  type AlarmLaunchPayload,
} from "../../modules/tempo-alarm";

function formatScheduledAt(scheduledAt: string | null): string {
  if (!scheduledAt) {
    return "Now";
  }

  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    return "Now";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlarmRoot(props: Partial<AlarmLaunchPayload>) {
  const [resolvedPayload, setResolvedPayload] = useState<AlarmLaunchPayload>({
    alarmInstanceId: props.alarmInstanceId ?? null,
    intensity: props.intensity ?? null,
    notificationId: props.notificationId ?? props.alarmInstanceId ?? null,
    rhythmId: props.rhythmId ?? null,
    rhythmName: props.rhythmName ?? null,
    scheduledAt: props.scheduledAt ?? null,
  });

  useEffect(() => {
    let cancelled = false;

    async function hydratePayload() {
      const nativePayload = TempoAlarmModule.getInitialAlarmPayload();
      const initial = await notifee.getInitialNotification();
      const displayed = await notifee.getDisplayedNotifications();
      const latestDisplayed = displayed
        .map((entry) => entry.notification)
        .filter(Boolean)
        .sort((left, right) => {
          const leftAt = left?.data?.scheduledAt
            ? new Date(String(left.data.scheduledAt)).getTime()
            : 0;
          const rightAt = right?.data?.scheduledAt
            ? new Date(String(right.data.scheduledAt)).getTime()
            : 0;
          return rightAt - leftAt;
        })[0];

      if (cancelled) {
        return;
      }

      setResolvedPayload((current) => ({
        alarmInstanceId:
          current.alarmInstanceId ??
          nativePayload.alarmInstanceId ??
          (initial?.notification?.data?.alarmInstanceId as
            | string
            | undefined) ??
          latestDisplayed?.id ??
          null,
        intensity:
          current.intensity ??
          nativePayload.intensity ??
          (initial?.notification?.data?.intensity as string | undefined) ??
          (latestDisplayed?.data?.intensity as string | undefined) ??
          null,
        notificationId:
          current.notificationId ??
          nativePayload.notificationId ??
          initial?.notification?.id ??
          latestDisplayed?.id ??
          null,
        rhythmId:
          current.rhythmId ??
          nativePayload.rhythmId ??
          (initial?.notification?.data?.rhythmId as string | undefined) ??
          (latestDisplayed?.data?.rhythmId as string | undefined) ??
          null,
        rhythmName:
          current.rhythmName ??
          nativePayload.rhythmName ??
          (initial?.notification?.data?.rhythmName as string | undefined) ??
          (latestDisplayed?.data?.rhythmName as string | undefined) ??
          null,
        scheduledAt:
          current.scheduledAt ??
          nativePayload.scheduledAt ??
          (initial?.notification?.data?.scheduledAt as string | undefined) ??
          (latestDisplayed?.data?.scheduledAt as string | undefined) ??
          null,
      }));
    }

    hydratePayload().catch((error) => {
      if (cancelled) {
        return;
      }

      logAlarmEvent("schedule_failed", {
        source: "alarm-screen-hydrate",
        detail: error instanceof Error ? error.message : String(error),
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const alarmInstanceId = resolvedPayload.alarmInstanceId;
  const notificationId = resolvedPayload.notificationId ?? alarmInstanceId;
  const rhythmId = resolvedPayload.rhythmId;
  const rhythmName = resolvedPayload.rhythmName ?? "Beat";
  const scheduledAt = resolvedPayload.scheduledAt;
  const canDismissNotification = useMemo(
    () => Boolean(notificationId),
    [notificationId]
  );

  async function handleDismiss() {
    logAlarmEvent("dismissed", {
      source: "alarm-screen-dismiss",
      alarmInstanceId,
      notificationId,
      rhythmId,
      rhythmName,
      scheduledAt,
    });

    if (notificationId) {
      await notifee.cancelNotification(notificationId);
    } else {
      logAlarmEvent("schedule_skipped", {
        source: "alarm-screen-dismiss",
        detail: "missing-notification-id",
        alarmInstanceId,
        rhythmId,
        rhythmName,
        scheduledAt,
      });
    }

    await TempoAlarmModule.clearActiveAlarmInstance(alarmInstanceId);
    await TempoAlarmModule.finishAlarmActivity();
  }

  async function handleOpenTempo() {
    logAlarmEvent("opened", {
      source: "alarm-screen-open-tempo",
      alarmInstanceId,
      notificationId,
      rhythmId,
      rhythmName,
      scheduledAt,
    });

    await TempoAlarmModule.openMainApp();
    await TempoAlarmModule.finishAlarmActivity();
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        backgroundColor: "#1A1714",
        paddingHorizontal: 28,
      }}
    >
      <View
        style={{
          borderWidth: 1,
          borderColor: "#3D352E",
          borderRadius: 24,
          backgroundColor: "#2A2420",
          paddingHorizontal: 24,
          paddingVertical: 32,
          gap: 12,
        }}
      >
        <Text
          style={{
            color: "#7A6F63",
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Pulse Alert
        </Text>
        <Text
          style={{
            color: "#EDE6DA",
            fontSize: 36,
            lineHeight: 42,
          }}
        >
          {rhythmName}
        </Text>
        <Text
          style={{
            color: "#9C8E80",
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          Time to check in.
        </Text>
        <Text
          style={{
            color: "#C4BAB0",
            fontSize: 14,
          }}
        >
          Scheduled for {formatScheduledAt(scheduledAt)}
        </Text>

        <View style={{ gap: 12, marginTop: 24 }}>
          <Pressable
            onPress={handleDismiss}
            style={{
              alignItems: "center",
              borderRadius: 18,
              backgroundColor: "#C06730",
              paddingVertical: 16,
            }}
          >
            <Text
              style={{
                color: "#EDE6DA",
                fontSize: 13,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              {canDismissNotification ? "Dismiss" : "Close"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleOpenTempo}
            style={{
              alignItems: "center",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#3D352E",
              paddingVertical: 16,
            }}
          >
            <Text
              style={{
                color: "#C4BAB0",
                fontSize: 13,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Open Tempo
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
