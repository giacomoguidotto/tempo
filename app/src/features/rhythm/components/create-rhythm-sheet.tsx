import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useSetAtom } from "jotai";
import {
  forwardRef,
  type Ref,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useConfirmDialog } from "@/components/ui/use-confirm-dialog";
import {
  DurationPickerModal,
  TimePickerModal,
} from "@/components/ui/wheel-picker";
import { scheduleRhythm } from "@/features/beat/engine";
import { requestAlarmPermissions } from "@/features/beat/permissions";
import { createRhythm, getAllRhythms } from "../operations";
import { randomPreset } from "../presets";
import type { IntensityLevel } from "../schemas";
import { rhythmsAtom } from "../store/atoms";
import { minutesToTime } from "../time-range";
import { RhythmFormFields } from "./rhythm-form-fields";

export interface CreateRhythmSheetHandle {
  present: () => void;
}

export const CreateRhythmSheet = forwardRef(function CreateRhythmSheet(
  _props: Record<string, unknown>,
  ref: Ref<CreateRhythmSheetHandle>
) {
  const insets = useSafeAreaInsets();
  const setRhythms = useSetAtom(rhythmsAtom);
  const sheetRef = useRef<BottomSheetModal>(null);
  const nameRef = useRef("");
  const initialRef = useRef({
    name: "",
    days: "",
    startTime: "",
    endTime: "",
    interval: 1,
    intensity: "",
  });
  const [nameInputKey, setNameInputKey] = useState(0);

  const [hasName, setHasName] = useState(false);
  const [nameDirty, setNameDirty] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [interval, setInterval] = useState(25);
  const [intensity, setIntensity] = useState<IntensityLevel>("nudge");
  const [showTimePicker, setShowTimePicker] = useState<"start" | "end" | null>(
    null
  );
  const [showDurationWheel, setShowDurationWheel] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { confirm: presentPermissionPrompt, dialog: permissionDialog } =
    useConfirmDialog();

  useImperativeHandle(ref, () => ({
    present() {
      resetForm();
      sheetRef.current?.present();
    },
  }));

  const canSave = hasName && selectedDays.length > 0;

  async function handleSave() {
    if (!canSave) {
      return;
    }
    const trimmedName = nameRef.current.trim();
    if (!trimmedName) {
      return;
    }
    const granted = await requestAlarmPermissions({
      presentPrompt: presentPermissionPrompt,
      requireFullScreen: intensity === "pulse" || intensity === "call",
    });
    if (!granted) {
      return;
    }
    const created = createRhythm({
      name: trimmedName,
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
    sheetRef.current?.dismiss();
  }

  function resetForm() {
    const next = randomPreset();
    setNameInputKey((current) => current + 1);
    nameRef.current = next.name;
    initialRef.current = {
      name: next.name,
      days: JSON.stringify(next.days),
      startTime: next.startTime,
      endTime: next.endTime,
      interval: next.intervalMinutes,
      intensity: next.intensity,
    };
    setHasName(next.name.trim().length > 0);
    setNameDirty(false);
    setSelectedDays(next.days);
    setStartTime(next.startTime);
    setEndTime(next.endTime);
    setInterval(next.intervalMinutes);
    setIntensity(next.intensity);
  }

  const isDirty =
    nameDirty ||
    JSON.stringify(selectedDays) !== initialRef.current.days ||
    startTime !== initialRef.current.startTime ||
    endTime !== initialRef.current.endTime ||
    interval !== initialRef.current.interval ||
    intensity !== initialRef.current.intensity;

  function handleClose() {
    if (isDirty) {
      setShowConfirm(true);
    } else {
      sheetRef.current?.dismiss();
    }
  }

  const toggleDay = useCallback((day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }, []);

  const handleTimeRangeChange = useCallback((low: number, high: number) => {
    setStartTime(minutesToTime(low));
    setEndTime(minutesToTime(high));
  }, []);

  const handleIntervalChange = useCallback((value: number) => {
    setInterval(value);
    setShowDurationWheel(false);
  }, []);

  const handleNameChange = useCallback((value: string) => {
    nameRef.current = value;

    const nextHasName = value.trim().length > 0;
    setHasName((current) => (current === nextHasName ? current : nextHasName));

    const nextDirty = value !== initialRef.current.name;
    setNameDirty((current) => (current === nextDirty ? current : nextDirty));
  }, []);

  const renderBackdrop = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: bottom sheet backdrop typing
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        pressBehavior={isDirty ? "none" : "close"}
      />
    ),
    [isDirty]
  );

  return (
    <BottomSheetModal
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#1A1714" }}
      enableDynamicSizing={false}
      enableHandlePanningGesture={!isDirty}
      enablePanDownToClose={!isDirty}
      handleComponent={() => (
        <Pressable
          onPress={handleClose}
          style={{ alignItems: "center", paddingVertical: 12 }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#3D352E",
            }}
          />
        </Pressable>
      )}
      ref={sheetRef}
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <RhythmFormFields
          endTime={endTime}
          initialName={nameRef.current}
          intensity={intensity}
          interval={interval}
          nameInputKey={nameInputKey}
          onIntensityChange={setIntensity}
          onIntervalChange={handleIntervalChange}
          onNameChange={handleNameChange}
          onOpenDurationPicker={() => setShowDurationWheel(true)}
          onOpenEndTimePicker={() => setShowTimePicker("end")}
          onOpenStartTimePicker={() => setShowTimePicker("start")}
          onTimeRangeChange={handleTimeRangeChange}
          onToggleDay={toggleDay}
          selectedDays={selectedDays}
          startTime={startTime}
        />
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
        <TimePickerModal
          onClose={() => setShowTimePicker(null)}
          onConfirm={(time) => {
            if (showTimePicker === "start") {
              setStartTime(time);
            } else {
              setEndTime(time);
            }
          }}
          value={showTimePicker === "start" ? startTime : endTime}
          visible
        />
      )}

      <DurationPickerModal
        onClose={() => setShowDurationWheel(false)}
        onConfirm={setInterval}
        value={interval}
        visible={showDurationWheel}
      />

      {permissionDialog}

      <ConfirmDialog
        actions={[
          {
            label: "Cancel",
            onPress: () => setShowConfirm(false),
          },
          {
            label: "Discard",
            style: "destructive",
            onPress: () => {
              setShowConfirm(false);
              sheetRef.current?.dismiss();
            },
          },
          {
            label: "Save",
            style: "accent",
            onPress: () => {
              setShowConfirm(false);
              handleSave();
            },
          },
        ]}
        message="What would you like to do?"
        onClose={() => setShowConfirm(false)}
        title="Unsaved changes"
        visible={showConfirm}
      />
    </BottomSheetModal>
  );
});
