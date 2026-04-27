import notifee from "@notifee/react-native";
import { useEffect, useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { beat } from "@/lib/logger";
import { useReduceMotion } from "@/lib/use-reduce-motion";
import TempoAlarmModule, {
  type AlarmLaunchPayload,
} from "../../modules/tempo-alarm";
import { resolveAlarmPayload } from "./resolve-payload";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const RIPPLE_MAX = Math.hypot(SCREEN_W, SCREEN_H);
const RIPPLE_COUNT = 3;
const RIPPLE_DURATION = 900;
const RIPPLE_STAGGER = 180;

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

function RippleRing({ delay }: { delay: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withTiming(1, { duration: RIPPLE_DURATION })
    );
    opacity.value = withDelay(
      delay,
      withTiming(0, { duration: RIPPLE_DURATION })
    );
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    width: RIPPLE_MAX,
    height: RIPPLE_MAX,
    borderRadius: RIPPLE_MAX / 2,
    borderWidth: 1.5,
    borderColor: "rgba(192, 103, 48, 0.5)",
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animatedStyle} />;
}

export default function AlarmRoot(props: Partial<AlarmLaunchPayload>) {
  const reduceMotion = useReduceMotion();
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
      const native = TempoAlarmModule.getInitialAlarmPayload();
      const initialNotification = await notifee.getInitialNotification();
      const displayedNotifications = await notifee.getDisplayedNotifications();

      if (cancelled) {
        return;
      }

      setResolvedPayload((current) =>
        resolveAlarmPayload({
          props: current,
          native,
          initialNotification,
          displayedNotifications,
        })
      );
    }

    hydratePayload().catch((error) => {
      if (cancelled) {
        return;
      }

      beat.error("schedule_failed", {
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
    beat.info("dismissed", {
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
      beat.warn("schedule_skipped", {
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
    beat.info("opened", {
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
      {/* Ripple rings expanding from center */}
      {!reduceMotion && (
        <View pointerEvents="none" style={styles.rippleContainer}>
          {Array.from({ length: RIPPLE_COUNT }).map((_, i) => (
            <RippleRing
              delay={i * RIPPLE_STAGGER}
              // biome-ignore lint/suspicious/noArrayIndexKey: static ring list
              key={i}
            />
          ))}
        </View>
      )}

      {/* Card fades in after ripples start */}
      <Animated.View
        entering={FadeIn.delay(RIPPLE_STAGGER * 2).duration(500)}
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
        <Animated.Text
          entering={FadeIn.delay(500).duration(400)}
          style={{
            color: "#7A6F63",
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Pulse Alert
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(600).duration(400)}
          style={{
            color: "#EDE6DA",
            fontSize: 36,
            lineHeight: 42,
          }}
        >
          {rhythmName}
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(700).duration(400)}
          style={{
            color: "#9C8E80",
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          Time to check in.
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(800).duration(400)}
          style={{
            color: "#C4BAB0",
            fontSize: 14,
          }}
        >
          Scheduled for {formatScheduledAt(scheduledAt)}
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(950).duration(400)}
          style={{ gap: 12, marginTop: 24 }}
        >
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
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rippleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
