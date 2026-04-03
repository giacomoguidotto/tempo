import { Trash2 } from "lucide-react-native";
import { useRef } from "react";
import { Animated, Pressable, Switch, Text, View } from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import type { Rhythm } from "../schemas";

const DELETE_ANIM_DURATION = 250;
const MAX_TICKS = 9;
const TICK_W = 16;
const TICK_H = 3;
const TICK_GAP = 3;

interface RhythmCardProps {
  onDelete: (id: string) => void;
  onPress: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  rhythm: Rhythm;
}

export function RhythmCard({
  rhythm,
  onToggle,
  onPress,
  onDelete,
}: RhythmCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const heightAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const beatsToday = computeBeatsElapsed(rhythm);
  const totalBeats = computeTotalBeats(rhythm);
  const remaining = totalBeats - beatsToday;
  const nextBeat = computeNextBeat(rhythm);

  // How many ticks fit in each half (left = done, right = remaining)
  const halfMax = Math.floor(MAX_TICKS / 2);
  const doneTicks = Math.min(beatsToday, halfMax);
  const remainTicks = Math.min(remaining, MAX_TICKS - halfMax - 1);
  const doneOverflow = beatsToday - doneTicks;
  const remainOverflow = remaining - remainTicks;

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
          <Trash2 color="#9C6F63" size={20} />
        </Animated.View>
      </RectButton>
    );
  }

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        maxHeight: heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 200],
        }),
        marginBottom: heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 10],
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
        <Pressable
          className={`gap-3 rounded-[14px] px-5 py-[18px] ${
            rhythm.enabled
              ? "border border-border bg-surface"
              : "border border-border"
          }`}
          onPress={() => onPress(rhythm.id)}
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
                className="text-[10px] text-secondary uppercase tracking-[1.5px]"
                style={{ fontFamily: "IBMPlexMono_400Regular" }}
              >
                EVERY {rhythm.intervalMinutes} MIN ·{" "}
                {nextBeat && rhythm.enabled ? `NEXT ${nextBeat}` : "PAUSED"}
              </Text>
            </View>
            <Switch
              onValueChange={(value) => onToggle(rhythm.id, value)}
              thumbColor={rhythm.enabled ? "#EDE6DA" : "#4A433C"}
              trackColor={{ false: "#2A2420", true: "#C06730" }}
              value={rhythm.enabled}
            />
          </View>

          {/* Progress bar: done | center marker | remaining */}
          <View className="flex-row items-center">
            {/* Done ticks — left side */}
            {doneOverflow > 0 && (
              <Text
                className="mr-1 text-[8px] text-accent"
                style={{ fontFamily: "IBMPlexMono_400Regular" }}
              >
                {doneOverflow}+
              </Text>
            )}
            {Array.from({ length: doneTicks }).map((_, i) => (
              <View
                key={`done-${String(i)}`}
                style={{
                  width: TICK_W,
                  height: TICK_H,
                  borderRadius: 1.5,
                  backgroundColor: "#C06730",
                  marginRight: TICK_GAP,
                }}
              />
            ))}

            {/* Remaining ticks — right side */}
            {Array.from({ length: remainTicks }).map((_, i) => (
              <View
                key={`remain-${String(i)}`}
                style={{
                  width: TICK_W,
                  height: TICK_H,
                  borderRadius: 1.5,
                  backgroundColor: rhythm.enabled
                    ? "rgba(192, 103, 48, 0.25)"
                    : "#3D352E",
                  marginLeft: i === 0 ? 0 : TICK_GAP,
                }}
              />
            ))}
            {remainOverflow > 0 && (
              <Text
                className="ml-1 text-[8px] text-muted"
                style={{ fontFamily: "IBMPlexMono_400Regular" }}
              >
                +{remainOverflow}
              </Text>
            )}

            <View className="flex-1" />
            <Text
              className="text-[10px] text-secondary"
              style={{ fontFamily: "IBMPlexMono_400Regular" }}
            >
              {beatsToday}/{totalBeats}
            </Text>
          </View>
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function computeTotalBeats(rhythm: Rhythm): number {
  return Math.floor(
    minutesBetween(rhythm.startTime, rhythm.endTime) / rhythm.intervalMinutes
  );
}

function computeBeatsElapsed(rhythm: Rhythm): number {
  const now = new Date();
  if (!rhythm.days.includes(now.getDay())) {
    return 0;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = rhythm.startTime.split(":").map(Number);
  const [eh, em] = rhythm.endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  if (currentMinutes < startMin) {
    return 0;
  }

  let count = 0;
  for (let t = startMin; t <= endMin; t += rhythm.intervalMinutes) {
    if (t <= currentMinutes) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function computeNextBeat(rhythm: Rhythm): string | null {
  const now = new Date();
  if (!rhythm.days.includes(now.getDay())) {
    return null;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = rhythm.startTime.split(":").map(Number);
  const [eh, em] = rhythm.endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  for (let t = startMin; t <= endMin; t += rhythm.intervalMinutes) {
    if (t > currentMinutes) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  return null;
}
