import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { Trash2 } from "lucide-react-native";
import { useRef } from "react";
import {
  type AccessibilityActionEvent,
  Animated,
  Switch,
  Text,
  View,
} from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { PressableScale } from "@/components/ui/pressable-scale";
import type { Rhythm } from "../schemas";
import { getRelevantWindowBeats, getUpcomingBeatDates } from "../time-range";

const DELETE_ANIM_DURATION = 250;
const DISPLAY_TICKS = 10;
const TICK_W = 14;
const TICK_H = 3;
const TICK_GAP = 3;

const COLOR_DONE = "#C06730";
const COLOR_DIM = "rgba(192, 103, 48, 0.2)";
const COLOR_OFF = "#3D352E";

interface RhythmCardProps {
  isDragging?: boolean;
  onDelete: (id: string) => void;
  onLongPress?: () => void;
  onMoveDown?: () => void;
  onMoveUp?: () => void;
  onPress: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  rhythm: Rhythm;
}

export function RhythmCard({
  rhythm,
  isDragging,
  onToggle,
  onPress,
  onDelete,
  onLongPress,
  onMoveUp,
  onMoveDown,
}: RhythmCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const heightAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const { done, total, currentProgress, allDoneForToday } =
    computeProgress(rhythm);
  const nextBeat = computeNextBeat(rhythm);
  const numTicks = Math.min(total, DISPLAY_TICKS);

  function handleDelete() {
    swipeableRef.current?.close();
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: 0,
        duration: DELETE_ANIM_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: DELETE_ANIM_DURATION,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onDelete(rhythm.id);
    });
  }

  function renderRightActions(
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });

    return (
      <RectButton
        accessibilityLabel={`Delete ${rhythm.name}`}
        accessibilityRole="button"
        onPress={handleDelete}
        style={{
          backgroundColor: "#3D2E28",
          justifyContent: "center",
          alignItems: "center",
          width: 72,
          borderRadius: 14,
          marginLeft: 8,
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Trash2 color="#C4796A" size={20} />
        </Animated.View>
      </RectButton>
    );
  }

  // Map tick index to progress state
  function tickColor(i: number): string {
    if (!rhythm.enabled) {
      return COLOR_OFF;
    }

    // Scale tick index to beat space
    const beatPos = total <= DISPLAY_TICKS ? i : (i / DISPLAY_TICKS) * total;

    if (beatPos < done) {
      return COLOR_DONE;
    }

    if (beatPos < done + 1 && currentProgress > 0) {
      // This tick represents the in-progress beat — interpolate
      const t = currentProgress;
      const r = Math.round(61 + (192 - 61) * t);
      const g = Math.round(46 + (103 - 46) * t);
      const b = Math.round(34 + (48 - 34) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }

    return COLOR_DIM;
  }

  const a11yActions = [
    ...(onMoveUp ? [{ name: "moveUp", label: "Move up" }] : []),
    ...(onMoveDown ? [{ name: "moveDown", label: "Move down" }] : []),
  ];

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    switch (event.nativeEvent.actionName) {
      case "moveUp":
        onMoveUp?.();
        break;
      case "moveDown":
        onMoveDown?.();
        break;
      default:
        break;
    }
  }

  return (
    <Animated.View
      accessibilityActions={a11yActions.length > 0 ? a11yActions : undefined}
      onAccessibilityAction={
        a11yActions.length > 0 ? handleAccessibilityAction : undefined
      }
      style={{
        opacity: opacityAnim,
        maxHeight: heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 200],
        }),
        marginBottom: heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 8],
        }),
        overflow: "hidden",
      }}
    >
      <Swipeable
        friction={2}
        overshootRight={false}
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
      >
        <PressableScale
          accessibilityLabel={`${rhythm.name}, every ${rhythm.intervalMinutes} minutes`}
          accessibilityRole="button"
          className={`gap-3 rounded-[14px] border bg-surface px-5 py-[18px] ${
            isDragging ? "border-accent" : "border-border"
          }`}
          onLongPress={() => {
            impactAsync(ImpactFeedbackStyle.Light);
            onLongPress?.();
          }}
          onPress={() => onPress(rhythm.id)}
          scale={0.97}
        >
          <View className="flex-row items-center justify-between">
            <View className="mr-3 flex-1 gap-[3px]">
              <Text
                className={`text-lg ${rhythm.enabled ? "text-foreground" : "text-secondary"}`}
                style={{ fontFamily: "Fraunces_600SemiBold" }}
              >
                {rhythm.name}
              </Text>
              <Text
                className="text-secondary text-xs uppercase tracking-[1.5px]"
                style={{ fontFamily: "IBMPlexMono_400Regular" }}
              >
                EVERY {rhythm.intervalMinutes} MIN ·{" "}
                {statusLabel(
                  rhythm.enabled,
                  allDoneForToday,
                  nextBeat,
                  rhythm.days
                )}
              </Text>
            </View>
            <Switch
              accessibilityLabel={`${rhythm.name}, ${rhythm.enabled ? "active" : "inactive"}`}
              accessibilityRole="switch"
              onValueChange={(value) => onToggle(rhythm.id, value)}
              thumbColor={rhythm.enabled ? "#EDE6DA" : "#6B6058"}
              trackColor={{ false: "#2A2420", true: "#C06730" }}
              value={rhythm.enabled}
            />
          </View>

          <View
            accessibilityLabel={`${done} of ${total} beats completed`}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: total, now: done }}
            className="flex-row items-center"
          >
            {Array.from({ length: numTicks }).map((_, i) => (
              <View
                key={`t-${String(i)}`}
                style={{
                  width: TICK_W,
                  height: TICK_H,
                  borderRadius: 1.5,
                  backgroundColor: tickColor(i),
                  marginRight: i < numTicks - 1 ? TICK_GAP : 0,
                }}
              />
            ))}
            <View className="flex-1" />
            <Text
              className="text-secondary text-xs"
              style={{ fontFamily: "IBMPlexMono_400Regular" }}
            >
              {done}/{total}
            </Text>
          </View>
        </PressableScale>
      </Swipeable>
    </Animated.View>
  );
}

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function nextActiveDay(days: number[]): string | null {
  if (days.length === 0) {
    return null;
  }
  const today = new Date().getDay();
  for (let offset = 1; offset <= 7; offset++) {
    const day = (today + offset) % 7;
    if (days.includes(day)) {
      return DAY_NAMES[day];
    }
  }
  return null;
}

function statusLabel(
  enabled: boolean,
  allDone: boolean,
  nextBeat: string | null,
  days: number[]
): string {
  if (!enabled) {
    return "OFF";
  }
  if (nextBeat) {
    return `NEXT ${nextBeat}`;
  }
  if (allDone) {
    const nextDay = nextActiveDay(days);
    return nextDay ? `DONE · NEXT ${nextDay}` : "DONE FOR TODAY";
  }
  // Today not in schedule
  const nextDay = nextActiveDay(days);
  return nextDay ? `NEXT ${nextDay}` : "OFF";
}

function computeProgress(rhythm: Rhythm): {
  done: number;
  total: number;
  currentProgress: number;
  allDoneForToday: boolean;
} {
  const now = new Date();
  const beats = getRelevantWindowBeats(rhythm, now);
  const total = beats.length;

  if (total === 0) {
    return { done: 0, total: 0, currentProgress: 0, allDoneForToday: false };
  }

  const done = beats.filter((beat) => beat.getTime() <= now.getTime()).length;
  if (done === 0) {
    return { done: 0, total, currentProgress: 0, allDoneForToday: false };
  }

  const allDoneForToday = done >= total;
  const lastBeatAt = beats[Math.min(done - 1, beats.length - 1)];
  const elapsedMinutes = (now.getTime() - lastBeatAt.getTime()) / 60_000;

  const currentProgress = allDoneForToday
    ? 1
    : Math.min(elapsedMinutes / rhythm.intervalMinutes, 1);

  return {
    done: Math.min(done, total),
    total,
    currentProgress,
    allDoneForToday,
  };
}

function computeNextBeat(rhythm: Rhythm): string | null {
  const now = new Date();
  const nextBeat = getUpcomingBeatDates(rhythm, 1, now)[0];
  if (!nextBeat) {
    return null;
  }

  const isSameDay =
    nextBeat.getFullYear() === now.getFullYear() &&
    nextBeat.getMonth() === now.getMonth() &&
    nextBeat.getDate() === now.getDate();

  if (!isSameDay) {
    return null;
  }

  return `${String(nextBeat.getHours()).padStart(2, "0")}:${String(nextBeat.getMinutes()).padStart(2, "0")}`;
}
