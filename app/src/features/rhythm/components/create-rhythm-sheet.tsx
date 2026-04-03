import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSetAtom } from "jotai";
import { forwardRef, type Ref, useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RangeSlider } from "@/components/ui/range-slider";
import { Slider } from "@/components/ui/slider";
import { scheduleRhythm } from "@/features/beat/engine";
import { requestAlarmPermissions } from "@/features/beat/permissions";
import { createRhythm, getAllRhythms } from "../operations";
import type { IntensityLevel } from "../schemas";
import { rhythmsAtom } from "../store/atoms";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const INTERVAL_PRESETS = [5, 15, 25, 30, 45, 60, 90];
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

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

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
  const [showTimePicker, setShowTimePicker] = useState<"start" | "end" | null>(
    null
  );
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);

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

  function handleTimeRangeChange(low: number, high: number) {
    setStartTime(minutesToTime(low));
    setEndTime(minutesToTime(high));
  }

  function handleTimePickerChange(
    which: "start" | "end",
    date: Date | undefined
  ) {
    setShowTimePicker(null);
    if (!date) {
      return;
    }
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    if (which === "start") {
      setStartTime(time);
    } else {
      setEndTime(time);
    }
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
        <View style={{ paddingVertical: 16, gap: 6 }}>
          <Label>Name</Label>
          <TextInput
            onChangeText={setName}
            placeholder="e.g. Deep Work"
            placeholderTextColor="#4A433C"
            style={{
              fontFamily: "Fraunces_400Regular",
              fontSize: 20,
              color: "#EDE6DA",
              borderBottomWidth: 1.5,
              borderBottomColor: "#2A2420",
              paddingBottom: 6,
            }}
            value={name}
          />
        </View>

        {/* Days */}
        <View style={{ paddingVertical: 16, gap: 10 }}>
          <Label>Days</Label>
          <View className="flex-row justify-between">
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
          <Divider />
        </View>

        {/* Time Range */}
        <View style={{ paddingVertical: 16, gap: 16 }}>
          <View className="flex-row justify-between">
            <View style={{ gap: 4 }}>
              <Label>From</Label>
              <Pressable onPress={() => setShowTimePicker("start")}>
                <Text
                  style={{
                    fontFamily: "IBMPlexMono_500Medium",
                    fontSize: 32,
                    color: "#EDE6DA",
                    letterSpacing: 2,
                    borderBottomWidth: 1.5,
                    borderBottomColor: "#3D352E",
                    paddingBottom: 4,
                  }}
                >
                  {startTime}
                </Text>
              </Pressable>
            </View>
            <View style={{ gap: 4, alignItems: "flex-end" }}>
              <Label>To</Label>
              <Pressable onPress={() => setShowTimePicker("end")}>
                <Text
                  style={{
                    fontFamily: "IBMPlexMono_500Medium",
                    fontSize: 32,
                    color: "#EDE6DA",
                    letterSpacing: 2,
                    borderBottomWidth: 1.5,
                    borderBottomColor: "#3D352E",
                    paddingBottom: 4,
                  }}
                >
                  {endTime}
                </Text>
              </Pressable>
            </View>
          </View>
          <RangeSlider
            max={1440}
            min={0}
            onValuesChange={handleTimeRangeChange}
            step={60}
            valueHigh={timeToMinutes(endTime)}
            valueLow={timeToMinutes(startTime)}
          />
          <Divider />
        </View>

        {/* Interval */}
        <View style={{ paddingVertical: 16, gap: 12 }}>
          <Label>Every</Label>
          <Pressable onPress={() => setShowIntervalPicker(true)}>
            <Text
              style={{
                fontFamily: "IBMPlexMono_500Medium",
                fontSize: 32,
                color: "#EDE6DA",
                letterSpacing: 2,
                borderBottomWidth: 1.5,
                borderBottomColor: "#3D352E",
                paddingBottom: 4,
                alignSelf: "flex-start",
              }}
            >
              {interval} min
            </Text>
          </Pressable>
          <View className="flex-row flex-wrap gap-[6px]">
            {INTERVAL_PRESETS.map((mins) => (
              <Pressable
                key={mins}
                onPress={() => setInterval(mins)}
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: interval === mins ? "#C06730" : "#2A2420",
                  backgroundColor:
                    interval === mins
                      ? "rgba(192, 103, 48, 0.15)"
                      : "transparent",
                }}
              >
                <Text
                  style={{
                    fontFamily: "IBMPlexMono_400Regular",
                    fontSize: 11,
                    color: interval === mins ? "#C06730" : "#4A433C",
                  }}
                >
                  {mins}
                </Text>
              </Pressable>
            ))}
          </View>
          <Slider
            max={120}
            min={1}
            onValueChange={setInterval}
            snapPoints={INTERVAL_PRESETS}
            value={interval}
          />
          <Divider />
        </View>

        {/* Intensity */}
        <View style={{ paddingVertical: 16, gap: 10 }}>
          <Label>Intensity</Label>
          <View className="flex-row gap-2">
            {INTENSITIES.map(({ value, label }) => (
              <Pressable
                key={value}
                onPress={() => setIntensity(value)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: intensity === value ? "#C06730" : "#2A2420",
                  backgroundColor:
                    intensity === value
                      ? "rgba(192, 103, 48, 0.15)"
                      : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "IBMPlexMono_500Medium",
                    fontSize: 11,
                    color: intensity === value ? "#C06730" : "#4A433C",
                  }}
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

      {/* Save button */}
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

      {/* Time Picker Dialog */}
      {showTimePicker && (
        <DateTimePicker
          is24Hour
          minuteInterval={15}
          mode="time"
          onChange={(_e, date) => handleTimePickerChange(showTimePicker, date)}
          value={(() => {
            const t = showTimePicker === "start" ? startTime : endTime;
            const [h, m] = t.split(":").map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
          })()}
        />
      )}

      {/* Interval Picker Dialog */}
      {showIntervalPicker && (
        <DateTimePicker
          is24Hour
          minuteInterval={5}
          mode="countdown"
          onChange={(_e, date) => {
            setShowIntervalPicker(false);
            if (date) {
              const totalMins = date.getHours() * 60 + date.getMinutes();
              if (totalMins >= 1) {
                setInterval(totalMins);
              }
            }
          }}
          value={(() => {
            const d = new Date();
            d.setHours(Math.floor(interval / 60), interval % 60, 0, 0);
            return d;
          })()}
        />
      )}
    </BottomSheetModal>
  );
});

function Label({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: "IBMPlexMono_400Regular",
        fontSize: 10,
        letterSpacing: 2,
        color: "#7A6F63",
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}

function Divider() {
  return (
    <View style={{ height: 1, backgroundColor: "#2A2420", marginTop: 8 }} />
  );
}
