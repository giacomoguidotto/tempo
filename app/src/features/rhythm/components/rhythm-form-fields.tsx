import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { memo, useRef } from "react";
import { Platform, Pressable, Text, useColorScheme, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  type GestureUpdateEvent,
  type PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { RangeSlider } from "@/components/ui/range-slider";
import { colors } from "@/constants/tokens";
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
  onSetDay: (day: number, selected: boolean) => void;
  onTimeRangeChange: (low: number, high: number) => void;
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
  onSetDay,
  onTimeRangeChange,
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
      <DaysField onSetDay={onSetDay} selectedDays={selectedDays} />
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
  const scheme = useColorScheme();
  const theme = colors[scheme === "light" ? "light" : "dark"];

  return (
    <View style={{ paddingVertical: 16, gap: 6 }}>
      <Label>Name</Label>
      <BottomSheetTextInput
        autoCorrect={false}
        cursorColor={theme.accent}
        defaultValue={initialName}
        key={nameInputKey}
        onChangeText={onNameChange}
        placeholder="e.g. Deep Work"
        placeholderTextColor={theme.muted}
        spellCheck={false}
        style={{
          fontFamily: Platform.select({
            android: "sans-serif",
            default: "IBMPlexMono_500Medium",
          }),
          fontSize: 20,
          color: theme.foreground,
          borderBottomWidth: 1.5,
          borderBottomColor: theme.surface,
          paddingBottom: 8,
        }}
        underlineColorAndroid="transparent"
      />
    </View>
  );
});

const DaysField = memo(function DaysField({
  onSetDay,
  selectedDays,
}: {
  onSetDay: (day: number, selected: boolean) => void;
  selectedDays: number[];
}) {
  const rowRef = useRef<View>(null);
  const layoutRef = useRef({ width: 0, x: 0 });
  const visitedDaysRef = useRef<Set<number>>(new Set());
  const gestureActionRef = useRef<boolean | null>(null);

  function measure() {
    rowRef.current?.measureInWindow((x, _y, width) => {
      if (width > 0) {
        layoutRef.current = { width, x };
      }
    });
  }

  function resolveDayIndex(absoluteX: number): number | null {
    if (layoutRef.current.width <= 0) {
      return null;
    }

    const relativeX = absoluteX - layoutRef.current.x;
    const clampedX = Math.max(
      0,
      Math.min(layoutRef.current.width - 1, relativeX)
    );
    const slotWidth = layoutRef.current.width / DAYS.length;
    const index = Math.floor(clampedX / slotWidth);

    if (index < 0 || index >= DAYS.length) {
      return null;
    }

    return index;
  }

  function applyTouchedDay(absoluteX: number) {
    const dayIndex = resolveDayIndex(absoluteX);
    if (dayIndex === null || visitedDaysRef.current.has(dayIndex)) {
      return;
    }

    if (gestureActionRef.current === null) {
      gestureActionRef.current = !selectedDays.includes(dayIndex);
    }

    visitedDaysRef.current.add(dayIndex);
    onSetDay(dayIndex, gestureActionRef.current);
  }

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .shouldCancelWhenOutside(false)
    .onBegin((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      visitedDaysRef.current = new Set();
      gestureActionRef.current = null;
      measure();
      applyTouchedDay(event.absoluteX);
    })
    .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      applyTouchedDay(event.absoluteX);
    })
    .onFinalize(() => {
      visitedDaysRef.current = new Set();
      gestureActionRef.current = null;
    });

  return (
    <View style={{ paddingVertical: 16, gap: 10 }}>
      <Label>Days</Label>
      <GestureDetector gesture={panGesture}>
        <View
          className="flex-row justify-between"
          onLayout={measure}
          ref={rowRef}
        >
          {DAYS.map((label, index) => (
            <View
              className={`h-10 w-10 items-center justify-center rounded-full ${
                selectedDays.includes(index)
                  ? "bg-accent"
                  : "border border-border"
              }`}
              // biome-ignore lint/suspicious/noArrayIndexKey: static day list
              key={index}
            >
              <Text
                className={`text-xs ${selectedDays.includes(index) ? "text-foreground" : "text-secondary"}`}
                style={{ fontFamily: "IBMPlexMono_500Medium" }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
      </GestureDetector>
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
        className="text-secondary text-xs"
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
          className="self-start text-[32px] text-foreground tracking-[2px]"
          style={{
            fontFamily: "IBMPlexMono_500Medium",
            borderBottomWidth: 1.5,
            borderBottomColor: "#3D352E",
            paddingBottom: 4,
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
              className={`text-xs ${interval === minutes ? "text-accent" : "text-secondary"}`}
              style={{ fontFamily: "IBMPlexMono_400Regular" }}
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
              className={`text-xs ${intensity === value ? "text-accent" : "text-secondary"}`}
              style={{ fontFamily: "IBMPlexMono_500Medium" }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      {selectedIntensity ? (
        <Text
          className="pt-1 text-secondary text-xs"
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
      className="text-[32px] text-foreground tracking-[2px]"
      style={{
        fontFamily: "IBMPlexMono_500Medium",
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
      className="text-secondary text-xs uppercase tracking-[2px]"
      style={{ fontFamily: "IBMPlexMono_400Regular" }}
    >
      {children}
    </Text>
  );
}

function Divider() {
  return <View className="mt-2 h-px bg-surface" />;
}
