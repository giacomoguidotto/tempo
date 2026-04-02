import { useRouter } from "expo-router";
import { useSetAtom } from "jotai";
import { X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createRhythm, getAllRhythms } from "@/features/rhythm/operations";
import type { IntensityLevel } from "@/features/rhythm/schemas";
import { rhythmsAtom } from "@/features/rhythm/store/atoms";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const INTERVALS = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120];
const INTENSITIES: { value: IntensityLevel; label: string }[] = [
  { value: "whisper", label: "Whisper" },
  { value: "nudge", label: "Nudge" },
  { value: "pulse", label: "Pulse" },
  { value: "call", label: "Call" },
];

export default function CreateRhythmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setRhythms = useSetAtom(rhythmsAtom);

  const [name, setName] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [interval, setInterval] = useState(25);
  const [intensity, setIntensity] = useState<IntensityLevel>("nudge");

  function handleSave() {
    if (!name.trim()) {
      return;
    }
    createRhythm({
      name: name.trim(),
      days: selectedDays,
      startTime,
      endTime,
      intervalMinutes: interval,
      intensity,
      enabled: true,
    });
    setRhythms(getAllRhythms());
    router.back();
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-7 py-4">
        <Pressable onPress={() => router.back()}>
          <X color="#7A6F63" size={24} />
        </Pressable>
        <Text
          className="text-foreground text-lg"
          style={{ fontFamily: "Fraunces_600SemiBold" }}
        >
          New Rhythm
        </Text>
        <Pressable onPress={handleSave}>
          <Text
            className="text-accent text-sm"
            style={{ fontFamily: "IBMPlexMono_500Medium" }}
          >
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-7" showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View className="gap-2 py-4">
          <Label>Name</Label>
          <TextInput
            onChangeText={setName}
            placeholder="e.g. Deep Work"
            placeholderTextColor="#4A433C"
            style={{
              fontFamily: "Fraunces_400Regular",
              fontSize: 16,
              color: "#EDE6DA",
              backgroundColor: "#2A2420",
              borderColor: "#3D352E",
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
            value={name}
          />
        </View>

        {/* Days */}
        <View className="gap-2 py-4">
          <Label>Days</Label>
          <View className="flex-row gap-2">
            {DAYS.map((label, i) => (
              <Pressable
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  selectedDays.includes(i)
                    ? "bg-accent"
                    : "border border-border"
                }`}
                // biome-ignore lint/suspicious/noArrayIndexKey: static day list
                key={i}
                onPress={() => toggleDay(i)}
              >
                <Text
                  className={`text-xs ${selectedDays.includes(i) ? "text-foreground" : "text-secondary"}`}
                  style={{ fontFamily: "IBMPlexMono_500Medium" }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Time Range */}
        <View className="flex-row gap-4 py-4">
          <View className="flex-1 gap-2">
            <Label>From</Label>
            <TextInput
              onChangeText={setStartTime}
              placeholder="09:00"
              placeholderTextColor="#4A433C"
              style={{
                fontFamily: "IBMPlexMono_400Regular",
                fontSize: 16,
                color: "#EDE6DA",
                backgroundColor: "#2A2420",
                borderColor: "#3D352E",
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                textAlign: "center",
              }}
              value={startTime}
            />
          </View>
          <View className="flex-1 gap-2">
            <Label>Until</Label>
            <TextInput
              onChangeText={setEndTime}
              placeholder="17:00"
              placeholderTextColor="#4A433C"
              style={{
                fontFamily: "IBMPlexMono_400Regular",
                fontSize: 16,
                color: "#EDE6DA",
                backgroundColor: "#2A2420",
                borderColor: "#3D352E",
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                textAlign: "center",
              }}
              value={endTime}
            />
          </View>
        </View>

        {/* Interval */}
        <View className="gap-2 py-4">
          <Label>Interval</Label>
          <View className="flex-row flex-wrap gap-2">
            {INTERVALS.map((mins) => (
              <Pressable
                className={`rounded-xl px-4 py-2 ${
                  interval === mins ? "bg-accent" : "border border-border"
                }`}
                key={mins}
                onPress={() => setInterval(mins)}
              >
                <Text
                  className={`text-sm ${interval === mins ? "text-foreground" : "text-secondary"}`}
                  style={{ fontFamily: "IBMPlexMono_400Regular" }}
                >
                  {mins}m
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Intensity */}
        <View className="gap-2 py-4 pb-12">
          <Label>Intensity</Label>
          <View className="flex-row gap-2">
            {INTENSITIES.map(({ value, label }) => (
              <Pressable
                className={`flex-1 items-center rounded-xl py-3 ${
                  intensity === value ? "bg-accent" : "border border-border"
                }`}
                key={value}
                onPress={() => setIntensity(value)}
              >
                <Text
                  className={`text-xs ${intensity === value ? "text-foreground" : "text-secondary"}`}
                  style={{ fontFamily: "IBMPlexMono_500Medium" }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text
      className="text-[10px] text-secondary uppercase tracking-[2px]"
      style={{ fontFamily: "IBMPlexMono_400Regular" }}
    >
      {children}
    </Text>
  );
}
