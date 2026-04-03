import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useSetAtom } from "jotai";
import { forwardRef, type Ref, useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleRhythm } from "@/features/beat/engine";
import { requestAlarmPermissions } from "@/features/beat/permissions";
import { createRhythm, getAllRhythms } from "../operations";
import type { IntensityLevel } from "../schemas";
import { rhythmsAtom } from "../store/atoms";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const INTERVALS = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120];
const INTENSITIES: {
  value: IntensityLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "whisper",
    label: "Whisper",
    description: "A gentle buzz — glance at your phone when you feel it",
  },
  {
    value: "nudge",
    label: "Nudge",
    description: "A quick chime to pull you back, easy to catch",
  },
  {
    value: "pulse",
    label: "Pulse",
    description: "Takes over your screen — hard to miss, hard to ignore",
  },
  {
    value: "call",
    label: "Call",
    description: "Won't stop until you deal with it — for when it matters",
  },
];

const INPUT_STYLE = {
  fontFamily: "IBMPlexMono_400Regular",
  fontSize: 16,
  color: "#EDE6DA",
  backgroundColor: "#2A2420",
  borderColor: "#3D352E",
  borderWidth: 1,
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
} as const;

export const CreateRhythmSheet = forwardRef(function CreateRhythmSheet(
  _props: Record<string, never>,
  ref: Ref<BottomSheetModal>
) {
  const insets = useSafeAreaInsets();
  const setRhythms = useSetAtom(rhythmsAtom);

  const [name, setName] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [interval, setInterval] = useState(25);
  const [intensity, setIntensity] = useState<IntensityLevel>("nudge");

  const canSave = name.trim().length > 0 && selectedDays.length > 0;
  const selectedIntensity = INTENSITIES.find((i) => i.value === intensity);

  async function handleSave() {
    if (!canSave) {
      return;
    }
    const granted = await requestAlarmPermissions();
    if (!granted) {
      return;
    }
    const created = createRhythm({
      name: name.trim(),
      days: selectedDays,
      startTime,
      endTime,
      intervalMinutes: interval,
      intensity,
      enabled: true,
    });
    scheduleRhythm(created);
    setRhythms(getAllRhythms());
    resetForm();
    (ref as React.RefObject<BottomSheetModal>).current?.dismiss();
  }

  function resetForm() {
    setName("");
    setSelectedDays([1, 2, 3, 4, 5]);
    setStartTime("09:00");
    setEndTime("17:00");
    setInterval(25);
    setIntensity("nudge");
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  const renderBackdrop = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: bottom sheet backdrop typing
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#1A1714" }}
      enableDynamicSizing={false}
      enablePanDownToClose
      handleIndicatorStyle={{ backgroundColor: "#3D352E", width: 40 }}
      ref={ref}
      snapPoints={["90%"]}
    >
      {/* Header */}
      <View className="items-center px-7 py-3">
        <Text
          className="text-foreground text-lg"
          style={{ fontFamily: "Fraunces_600SemiBold" }}
        >
          New Rhythm
        </Text>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <View style={{ gap: 8, paddingVertical: 16 }}>
          <Label>Name</Label>
          <TextInput
            onChangeText={setName}
            placeholder="e.g. Deep Work"
            placeholderTextColor="#4A433C"
            style={{ ...INPUT_STYLE, fontFamily: "Fraunces_400Regular" }}
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
        <View style={{ flexDirection: "row", gap: 16, paddingVertical: 16 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Label>From</Label>
            <TextInput
              onChangeText={setStartTime}
              placeholder="09:00"
              placeholderTextColor="#4A433C"
              style={{ ...INPUT_STYLE, textAlign: "center" }}
              value={startTime}
            />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Label>Until</Label>
            <TextInput
              onChangeText={setEndTime}
              placeholder="17:00"
              placeholderTextColor="#4A433C"
              style={{ ...INPUT_STYLE, textAlign: "center" }}
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
        <View className="gap-2 py-4">
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
          {selectedIntensity && (
            <Text
              className="pt-1 text-[11px] text-secondary"
              style={{ fontFamily: "IBMPlexMono_400Regular" }}
            >
              {selectedIntensity.description}
            </Text>
          )}
        </View>
      </BottomSheetScrollView>

      {/* Bottom save button */}
      <View
        className="px-7 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          className={`items-center rounded-2xl py-4 ${canSave ? "bg-accent" : "bg-border"}`}
          disabled={!canSave}
          onPress={handleSave}
        >
          <Text
            className="text-foreground text-sm uppercase tracking-[2px]"
            style={{ fontFamily: "IBMPlexMono_500Medium" }}
          >
            Create Rhythm
          </Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
});

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
