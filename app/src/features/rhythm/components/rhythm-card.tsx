import { Trash2 } from "lucide-react-native";
import { useRef } from "react";
import { Animated, Pressable, Switch, Text, View } from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import type { Rhythm } from "../schemas";

const MAX_VISIBLE_BEATS = 8;
const DELETE_ANIM_DURATION = 250;

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

  const beatsToday = 0; // TODO: derive from beat log
  const totalBeats = Math.floor(
    minutesBetween(rhythm.startTime, rhythm.endTime) / rhythm.intervalMinutes
  );
  const visibleBeats = Math.min(totalBeats, MAX_VISIBLE_BEATS);
  const nextBeat = computeNextBeat(rhythm);

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

          <View className="flex-row items-center gap-1">
            {Array.from({ length: visibleBeats }).map((_, i) => {
              const filled = i < beatsToday;
              const muted = !filled && rhythm.enabled;
              let color = "bg-border";
              if (filled) {
                color = "bg-accent";
              } else if (muted) {
                color = "bg-accent/25";
              }
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: static beat indicators
                <View className={`h-[3px] w-5 rounded-sm ${color}`} key={i} />
              );
            })}
            {totalBeats > MAX_VISIBLE_BEATS && (
              <Text
                className="text-[8px] text-muted"
                style={{ fontFamily: "IBMPlexMono_400Regular" }}
              >
                +{totalBeats - MAX_VISIBLE_BEATS}
              </Text>
            )}
            <View className="flex-1" />
            <Text
              className="text-[10px] text-secondary"
              style={{ fontFamily: "IBMPlexMono_400Regular" }}
            >
              {beatsToday}/{totalBeats} today
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

function computeNextBeat(rhythm: Rhythm): string | null {
  const now = new Date();
  const currentDay = now.getDay();

  if (!rhythm.days.includes(currentDay)) {
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
