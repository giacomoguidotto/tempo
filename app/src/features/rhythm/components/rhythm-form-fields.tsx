import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { memo } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { RangeSlider } from "@/components/ui/range-slider";
import type { IntensityLevel } from "../schemas";
import { crossesMidnight, MINUTES_PER_DAY, timeToMinutes } from "../time-range";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const INTERVAL_PRESETS = [5, 15, 25, 30, 45, 60, 90];
const SLIDER_MAX = MINUTES_PER_DAY - 1;

const INTENSITIES: {
  description: string;
  label: string;
  value: IntensityLevel;
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
];

interface RhythmFormFieldsProps {
  endTime: string;
  initialName: string;
  intensity: IntensityLevel;
  interval: number;
  nameInputKey: number;
  onIntensityChange: (value: IntensityLevel) => void;
  onIntervalChange: (value: number) => void;
  onNameChange: (value: string) => void;
  onOpenDurationPicker: () => void;
  onOpenEndTimePicker: () => void;
  onOpenStartTimePicker: () => void;
  onTimeRangeChange: (low: number, high: number) => void;
  onToggleDay: (day: number) => void;
  selectedDays: number[];
  startTime: string;
}

export const RhythmFormFields = memo(function RhythmFormFields({
  endTime,
  initialName,
  intensity,
  interval,
  nameInputKey,
  onIntensityChange,
  onIntervalChange,
  onNameChange,
  onOpenDurationPicker,
  onOpenEndTimePicker,
  onOpenStartTimePicker,
  onTimeRangeChange,
  onToggleDay,
  selectedDays,
  startTime,
}: RhythmFormFieldsProps) {
  return (
    <>
      <NameField
        initialName={initialName}
        nameInputKey={nameInputKey}
        onNameChange={onNameChange}
      />
      <DaysField onToggleDay={onToggleDay} selectedDays={selectedDays} />
      <TimeRangeField
        endTime={endTime}
        onOpenEndTimePicker={onOpenEndTimePicker}
        onOpenStartTimePicker={onOpenStartTimePicker}
        onTimeRangeChange={onTimeRangeChange}
        startTime={startTime}
      />
      <IntervalField
        interval={interval}
        onIntervalChange={onIntervalChange}
        onOpenDurationPicker={onOpenDurationPicker}
      />
      <IntensityField
        intensity={intensity}
        onIntensityChange={onIntensityChange}
      />
    </>
  );
});

const NameField = memo(function NameField({
  initialName,
  nameInputKey,
  onNameChange,
}: {
  initialName: string;
  nameInputKey: number;
  onNameChange: (value: string) => void;
}) {
  return (
    <View style={{ paddingVertical: 16, gap: 6 }}>
      <Label>Name</Label>
      <BottomSheetTextInput
        autoCorrect={false}
        cursorColor="#C06730"
        defaultValue={initialName}
        key={nameInputKey}
        onChangeText={onNameChange}
        placeholder="e.g. Deep Work"
        placeholderTextColor="#4A433C"
        spellCheck={false}
        style={{
          fontFamily: Platform.select({
            android: "sans-serif",
            default: "IBMPlexMono_500Medium",
          }),
          fontSize: 20,
          color: "#EDE6DA",
          borderBottomWidth: 1.5,
          borderBottomColor: "#2A2420",
          paddingBottom: 8,
        }}
        underlineColorAndroid="transparent"
      />
    </View>
  );
});

const DaysField = memo(function DaysField({
  onToggleDay,
  selectedDays,
}: {
  onToggleDay: (day: number) => void;
  selectedDays: number[];
}) {
  return (
    <View style={{ paddingVertical: 16, gap: 10 }}>
      <Label>Days</Label>
      <View className="flex-row justify-between">
        {DAYS.map((label, index) => (
          <Pressable
            className={`h-10 w-10 items-center justify-center rounded-full ${
              selectedDays.includes(index)
                ? "bg-accent"
                : "border border-border"
            }`}
            // biome-ignore lint/suspicious/noArrayIndexKey: static day list
            key={index}
            onPress={() => onToggleDay(index)}
          >
            <Text
              className={`text-xs ${selectedDays.includes(index) ? "text-foreground" : "text-secondary"}`}
              style={{ fontFamily: "IBMPlexMono_500Medium" }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Divider />
    </View>
  );
});

const TimeRangeField = memo(function TimeRangeField({
  endTime,
  onOpenEndTimePicker,
  onOpenStartTimePicker,
  onTimeRangeChange,
  startTime,
}: {
  endTime: string;
  onOpenEndTimePicker: () => void;
  onOpenStartTimePicker: () => void;
  onTimeRangeChange: (low: number, high: number) => void;
  startTime: string;
}) {
  const wraps = crossesMidnight(startTime, endTime);

  return (
    <View style={{ paddingVertical: 16, gap: 16 }}>
      <View className="flex-row justify-between">
        <View style={{ gap: 4 }}>
          <Label>From</Label>
          <Pressable onPress={onOpenStartTimePicker}>
            <TimeValue>{startTime}</TimeValue>
          </Pressable>
        </View>
        <View style={{ gap: 4, alignItems: "flex-end" }}>
          <Label>{wraps ? "To (next day)" : "To"}</Label>
          <Pressable onPress={onOpenEndTimePicker}>
            <TimeValue>{endTime}</TimeValue>
          </Pressable>
        </View>
      </View>

      <RangeSlider
        max={SLIDER_MAX}
        min={0}
        onValuesChange={onTimeRangeChange}
        step={60}
        valueHigh={timeToMinutes(endTime)}
        valueLow={timeToMinutes(startTime)}
      />

      <Text
        className="text-[11px] text-secondary"
        style={{ fontFamily: "IBMPlexMono_400Regular", lineHeight: 18 }}
      >
        {wraps
          ? `Runs from ${startTime} until ${endTime} of the next day.`
          : `Runs from ${startTime} until ${endTime} on the same day.`}
      </Text>
      <Divider />
    </View>
  );
});

const IntervalField = memo(function IntervalField({
  interval,
  onIntervalChange,
  onOpenDurationPicker,
}: {
  interval: number;
  onIntervalChange: (value: number) => void;
  onOpenDurationPicker: () => void;
}) {
  return (
    <View style={{ paddingVertical: 16, gap: 12 }}>
      <Label>Every</Label>
      <Pressable onPress={onOpenDurationPicker}>
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
        {INTERVAL_PRESETS.map((minutes) => (
          <Pressable
            key={minutes}
            onPress={() => onIntervalChange(minutes)}
            style={{
              paddingVertical: 5,
              paddingHorizontal: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: interval === minutes ? "#C06730" : "#2A2420",
              backgroundColor:
                interval === minutes
                  ? "rgba(192, 103, 48, 0.15)"
                  : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily: "IBMPlexMono_400Regular",
                fontSize: 11,
                color: interval === minutes ? "#C06730" : "#4A433C",
              }}
            >
              {minutes}
            </Text>
          </Pressable>
        ))}
      </View>
      <Divider />
    </View>
  );
});

const IntensityField = memo(function IntensityField({
  intensity,
  onIntensityChange,
}: {
  intensity: IntensityLevel;
  onIntensityChange: (value: IntensityLevel) => void;
}) {
  const selectedIntensity = INTENSITIES.find(
    (entry) => entry.value === intensity
  );

  return (
    <View style={{ paddingVertical: 16, gap: 10 }}>
      <Label>Intensity</Label>
      <View className="flex-row gap-2">
        {INTENSITIES.map(({ value, label }) => (
          <Pressable
            key={value}
            onPress={() => onIntensityChange(value)}
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
      {selectedIntensity ? (
        <Text
          className="pt-1 text-[11px] text-secondary"
          style={{ fontFamily: "IBMPlexMono_400Regular" }}
        >
          {selectedIntensity.description}
        </Text>
      ) : null}
    </View>
  );
});

function TimeValue({ children }: { children: string }) {
  return (
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
      {children}
    </Text>
  );
}

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
