import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useSetAtom } from "jotai";
import { Trash2 } from "lucide-react-native";
import {
  forwardRef,
  type Ref,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { deleteRhythm, getAllRhythms, updateRhythm } from "../operations";
import type { IntensityLevel, Rhythm } from "../schemas";
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

export interface EditRhythmSheetHandle {
  open: (rhythm: Rhythm) => void;
}

export const EditRhythmSheet = forwardRef(function EditRhythmSheet(
  _props: Record<string, never>,
  ref: Ref<EditRhythmSheetHandle>
) {
  const insets = useSafeAreaInsets();
  const setRhythms = useSetAtom(rhythmsAtom);
  const sheetRef = useRef<BottomSheetModal>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [interval, setInterval] = useState(25);
  const [intensity, setIntensity] = useState<IntensityLevel>("nudge");

  useImperativeHandle(ref, () => ({
    open(rhythm: Rhythm) {
      setEditingId(rhythm.id);
      setName(rhythm.name);
      setSelectedDays(rhythm.days);
      setStartTime(rhythm.startTime);
      setEndTime(rhythm.endTime);
      setInterval(rhythm.intervalMinutes);
      setIntensity(rhythm.intensity);
      sheetRef.current?.present();
    },
  }));

  const canSave = name.trim().length > 0 && selectedDays.length > 0;
  const selectedIntensity = INTENSITIES.find((i) => i.value === intensity);

  function handleSave() {
    if (!(canSave && editingId)) {
      return;
    }
    updateRhythm(editingId, {
      name: name.trim(),
      days: selectedDays,
      startTime,
      endTime,
      intervalMinutes: interval,
      intensity,
    });
    setRhythms(getAllRhythms());
    sheetRef.current?.dismiss();
  }

  function handleDelete() {
    if (!editingId) {
      return;
    }
    deleteRhythm(editingId);
    setRhythms(getAllRhythms());
    sheetRef.current?.dismiss();
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
      ref={sheetRef}
      snapPoints={["90%"]}
    >
      <View className="items-center px-7 py-3">
        <Text
          className="text-foreground text-lg"
          style={{ fontFamily: "Fraunces_600SemiBold" }}
        >
          Edit Rhythm
        </Text>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
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

      <View
        className="flex-row gap-3 px-7 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          className="items-center justify-center rounded-2xl border border-border px-4 py-4"
          onPress={handleDelete}
        >
          <Trash2 color="#7A6F63" size={20} />
        </Pressable>
        <Pressable
          className={`flex-1 items-center rounded-2xl py-4 ${canSave ? "bg-accent" : "bg-border"}`}
          disabled={!canSave}
          onPress={handleSave}
        >
          <Text
            className="text-foreground text-sm uppercase tracking-[2px]"
            style={{ fontFamily: "IBMPlexMono_500Medium" }}
          >
            Save Changes
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
