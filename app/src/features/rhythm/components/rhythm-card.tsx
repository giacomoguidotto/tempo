import { Pressable, Switch, Text, View } from "react-native";
import type { Rhythm } from "../schemas";

interface RhythmCardProps {
  onPress: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  rhythm: Rhythm;
}

export function RhythmCard({ rhythm, onToggle, onPress }: RhythmCardProps) {
  const beatsToday = 0; // TODO: derive from beat log
  const totalBeats = Math.floor(
    minutesBetween(rhythm.startTime, rhythm.endTime) / rhythm.intervalMinutes
  );

  return (
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
            EVERY {rhythm.intervalMinutes} MIN · REPEATING
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
        {Array.from({ length: totalBeats }).map((_, i) => {
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
            <View className={`h-[3px] w-6 rounded-sm ${color}`} key={i} />
          );
        })}
        <View className="flex-1" />
        <Text
          className="text-[10px] text-secondary"
          style={{ fontFamily: "IBMPlexMono_400Regular" }}
        >
          {beatsToday}/{totalBeats} today
        </Text>
      </View>
    </Pressable>
  );
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}
