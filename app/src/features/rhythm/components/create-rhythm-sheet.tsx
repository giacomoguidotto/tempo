import {
  type BottomSheetBackdropProps,
  type BottomSheetHandleProps,
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
import { SheetBackdrop } from "@/components/ui/sheet-backdrop";
import { SheetHandle } from "@/components/ui/sheet-handle";
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
import {
  crossesMidnight,
  MINUTES_PER_DAY,
  minutesToTime,
  timeToMinutes,
} from "../time-range";
import { RhythmFormFields } from "./rhythm-form-fields";

export interface CreateRhythmSheetHandle {
  dismiss: () => void;
  present: () => void;
  requestClose: () => void;
}

interface CreateRhythmSheetProps {
  onDismiss?: () => void;
}

const SNAP_POINTS = ["60%", "90%"];

export const CreateRhythmSheet = forwardRef(function CreateRhythmSheet(
  { onDismiss }: CreateRhythmSheetProps,
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
  const isDirtyRef = useRef(false);
  const allowDismissRef = useRef(false);
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
    dismiss() {
      sheetRef.current?.dismiss();
    },
    present() {
      resetForm();
      sheetRef.current?.present();
    },
    requestClose() {
      handleClose();
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
    await scheduleRhythm(created, "create-rhythm");
    setRhythms(getAllRhythms());
    resetForm();
    allowDismissRef.current = true;
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

  isDirtyRef.current = isDirty;

  function handleClose() {
    if (isDirty) {
      setShowConfirm(true);
    } else {
      sheetRef.current?.dismiss();
    }
  }

  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  const setDay = useCallback((day: number, selected: boolean) => {
    setSelectedDays((prev) => {
      const has = prev.includes(day);
      if (selected && !has) {
        return [...prev, day].sort();
      }
      if (!selected && has) {
        return prev.filter((d) => d !== day);
      }
      return prev;
    });
  }, []);

  function clampIntervalToRange(start: string, end: string) {
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    const duration = s > e ? MINUTES_PER_DAY - s + e : e - s;
    if (duration > 0) {
      setInterval((prev) => Math.min(prev, duration));
    }
  }

  const handleTimeRangeChange = useCallback((low: number, high: number) => {
    const newStart = minutesToTime(low);
    const newEnd = minutesToTime(high);
    setStartTime(newStart);
    setEndTime(newEnd);
    const s = low;
    const e = high;
    const duration = s > e ? MINUTES_PER_DAY - s + e : e - s;
    if (duration > 0) {
      setInterval((prev) => Math.min(prev, duration));
    }
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

  const HandleComponent = useCallback(
    (props: BottomSheetHandleProps) => (
      <SheetHandle {...props} onPress={() => handleCloseRef.current()} />
    ),
    []
  );

  const BackdropComponent = useCallback(
    (props: BottomSheetBackdropProps) => (
      <SheetBackdrop {...props} onPress={() => handleCloseRef.current()} />
    ),
    []
  );

  return (
    <BottomSheetModal
      android_keyboardInputMode="adjustResize"
      backdropComponent={BackdropComponent}
      backgroundStyle={{ backgroundColor: "#1A1714" }}
      enableDynamicSizing={false}
      enablePanDownToClose
      handleComponent={HandleComponent}
      index={1}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onAnimate={(_fromIndex, toIndex) => {
        if (toIndex === -1 && isDirtyRef.current && !allowDismissRef.current) {
          sheetRef.current?.snapToIndex(0);
          setShowConfirm(true);
        }
      }}
      onDismiss={() => {
        allowDismissRef.current = false;
        onDismiss?.();
      }}
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
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
          onSetDay={setDay}
          onTimeRangeChange={handleTimeRangeChange}
          selectedDays={selectedDays}
          startTime={startTime}
        />
      </BottomSheetScrollView>

      <View
        className="px-7 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 32) }}
      >
        <Pressable
          className={`items-center rounded-2xl py-5 ${canSave ? "bg-accent" : "bg-border"}`}
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

      {showTimePicker && (
        <TimePickerModal
          onClose={() => setShowTimePicker(null)}
          onConfirm={(time) => {
            if (showTimePicker === "start") {
              setStartTime(time);
              clampIntervalToRange(time, endTime);
            } else {
              setEndTime(time);
              clampIntervalToRange(startTime, time);
            }
          }}
          value={showTimePicker === "start" ? startTime : endTime}
          visible
        />
      )}

      <DurationPickerModal
        max={
          crossesMidnight(startTime, endTime)
            ? MINUTES_PER_DAY -
              timeToMinutes(startTime) +
              timeToMinutes(endTime)
            : timeToMinutes(endTime) - timeToMinutes(startTime)
        }
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
              allowDismissRef.current = true;
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
