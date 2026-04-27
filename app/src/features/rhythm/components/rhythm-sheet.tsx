import {
  type BottomSheetBackdropProps,
  type BottomSheetHandleProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useSetAtom } from "jotai";
import { Trash2 } from "lucide-react-native";
import {
  forwardRef,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { BackHandler, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PressableScale } from "@/components/ui/pressable-scale";
import { SheetBackdrop } from "@/components/ui/sheet-backdrop";
import { SheetHandle } from "@/components/ui/sheet-handle";
import { useConfirmDialog } from "@/components/ui/use-confirm-dialog";
import {
  DurationPickerModal,
  TimePickerModal,
} from "@/components/ui/wheel-picker";
import { cancelRhythm, scheduleRhythm } from "@/features/beat/engine";
import { requestAlarmPermissions } from "@/features/beat/permissions";
import { syncStatusNotification } from "@/features/beat/status";
import {
  createRhythm,
  deleteRhythm,
  getAllRhythms,
  updateRhythm,
} from "../operations";
import { randomPreset } from "../presets";
import type { IntensityLevel, Rhythm } from "../schemas";
import { rhythmsAtom } from "../store/atoms";
import {
  crossesMidnight,
  MINUTES_PER_DAY,
  minutesToTime,
  timeToMinutes,
} from "../time-range";
import { RhythmFormFields } from "./rhythm-form-fields";

export interface RhythmSheetHandle {
  dismiss: () => void;
  requestClose: () => void;
}

interface RhythmSheetProps {
  onDismiss?: () => void;
  rhythm?: Rhythm;
}

interface Baseline {
  days: string;
  endTime: string;
  intensity: string;
  interval: number;
  name: string;
  startTime: string;
}

const SNAP_POINTS = ["60%", "90%"];

export const RhythmSheet = forwardRef(function RhythmSheet(
  { onDismiss, rhythm }: RhythmSheetProps,
  ref: Ref<RhythmSheetHandle>
) {
  const isEditing = rhythm !== undefined;
  const insets = useSafeAreaInsets();
  const setRhythms = useSetAtom(rhythmsAtom);
  const sheetRef = useRef<BottomSheetModal>(null);
  const nameRef = useRef("");
  const baselineRef = useRef<Baseline>({
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only initialization
  useEffect(() => {
    if (isEditing) {
      setNameInputKey((current) => current + 1);
      nameRef.current = rhythm.name;
      baselineRef.current = {
        name: rhythm.name,
        days: JSON.stringify(rhythm.days),
        startTime: rhythm.startTime,
        endTime: rhythm.endTime,
        interval: rhythm.intervalMinutes,
        intensity: rhythm.intensity,
      };
      setHasName(rhythm.name.trim().length > 0);
      setNameDirty(false);
      setSelectedDays(rhythm.days);
      setStartTime(rhythm.startTime);
      setEndTime(rhythm.endTime);
      setInterval(rhythm.intervalMinutes);
      setIntensity(rhythm.intensity);
    } else {
      resetForm();
    }
    sheetRef.current?.present();
  }, []);

  useImperativeHandle(ref, () => ({
    dismiss() {
      sheetRef.current?.dismiss();
    },
    requestClose() {
      handleClose();
    },
  }));

  const canSave = hasName && selectedDays.length > 0;

  function getFormValues() {
    return {
      name: nameRef.current.trim(),
      days: selectedDays,
      startTime,
      endTime,
      intervalMinutes: interval,
      intensity,
    };
  }

  async function saveEdit(): Promise<boolean> {
    if (!isEditing) {
      return true;
    }
    const updated = updateRhythm(rhythm.id, getFormValues());
    if (!updated) {
      return true;
    }
    if (updated.enabled) {
      const granted = await requestAlarmPermissions({
        presentPrompt: presentPermissionPrompt,
        requireFullScreen:
          updated.intensity === "pulse" || updated.intensity === "call",
      });
      if (!granted) {
        return false;
      }
    }
    await scheduleRhythm(updated, "edit-rhythm");
    return true;
  }

  async function saveCreate(): Promise<boolean> {
    const granted = await requestAlarmPermissions({
      presentPrompt: presentPermissionPrompt,
      requireFullScreen: intensity === "pulse" || intensity === "call",
    });
    if (!granted) {
      return false;
    }
    const created = createRhythm({ ...getFormValues(), enabled: true });
    await scheduleRhythm(created, "create-rhythm");
    resetForm();
    return true;
  }

  async function handleSave() {
    if (!(canSave && nameRef.current.trim())) {
      return;
    }
    const ok = isEditing ? await saveEdit() : await saveCreate();
    if (!ok) {
      return;
    }
    setRhythms(getAllRhythms());
    allowDismissRef.current = true;
    sheetRef.current?.dismiss();
  }

  async function handleDelete() {
    if (!isEditing) {
      return;
    }
    await cancelRhythm(rhythm.id);
    deleteRhythm(rhythm.id);
    setRhythms(getAllRhythms());
    await syncStatusNotification("edit-delete");
    allowDismissRef.current = true;
    sheetRef.current?.dismiss();
  }

  function resetForm() {
    const next = randomPreset();
    setNameInputKey((current) => current + 1);
    nameRef.current = next.name;
    baselineRef.current = {
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

  const isDirty = isEditing
    ? nameDirty ||
      interval !== baselineRef.current.interval ||
      startTime !== baselineRef.current.startTime ||
      endTime !== baselineRef.current.endTime ||
      intensity !== baselineRef.current.intensity ||
      JSON.stringify(selectedDays) !== baselineRef.current.days
    : nameDirty ||
      JSON.stringify(selectedDays) !== baselineRef.current.days ||
      startTime !== baselineRef.current.startTime ||
      endTime !== baselineRef.current.endTime ||
      interval !== baselineRef.current.interval ||
      intensity !== baselineRef.current.intensity;

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

  // Intercept hardware back when form is dirty (predictive back compatible)
  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setShowConfirm(true);
        return true;
      }
    );
    return () => subscription.remove();
  }, [isDirty]);

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
    setStartTime(minutesToTime(low));
    setEndTime(minutesToTime(high));
  }, []);

  function handleTimeRangeDragEnd() {
    clampIntervalToRange(startTime, endTime);
  }

  const handleIntervalChange = useCallback((value: number) => {
    setInterval(value);
    setShowDurationWheel(false);
  }, []);

  const handleNameChange = useCallback((value: string) => {
    nameRef.current = value;

    const nextHasName = value.trim().length > 0;
    setHasName((current) => (current === nextHasName ? current : nextHasName));

    const nextDirty = value !== baselineRef.current.name;
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
      enablePanDownToClose={!isDirty}
      handleComponent={HandleComponent}
      index={1}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onDismiss={() => {
        allowDismissRef.current = false;
        onDismiss?.();
      }}
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
    >
      <View
        accessibilityLabel={isEditing ? "Edit Rhythm" : "New Rhythm"}
        accessibilityRole="header"
        className="items-center px-7 py-3"
      >
        <Text
          className="text-foreground text-lg"
          style={{ fontFamily: "Fraunces_600SemiBold" }}
        >
          {isEditing ? "Edit Rhythm" : "New Rhythm"}
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
          onTimeRangeDragEnd={handleTimeRangeDragEnd}
          selectedDays={selectedDays}
          startTime={startTime}
        />
      </BottomSheetScrollView>

      <View
        className={`${isEditing ? "flex-row gap-3" : ""} px-7 pt-3`}
        style={{ paddingBottom: Math.max(insets.bottom, 32) }}
      >
        {isEditing && (
          <PressableScale
            accessibilityLabel="Delete rhythm"
            accessibilityRole="button"
            className="items-center justify-center rounded-2xl border border-border px-5 py-5"
            onPress={handleDelete}
          >
            <Trash2 color="#7A6F63" size={20} />
          </PressableScale>
        )}
        <PressableScale
          accessibilityLabel={isEditing ? "Save changes" : "Create rhythm"}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
          className={`${isEditing ? "flex-1" : ""} items-center rounded-2xl py-5 ${canSave ? "bg-accent" : "bg-border"}`}
          disabled={!canSave}
          onPress={handleSave}
        >
          <Text
            className="text-foreground text-sm uppercase tracking-[2px]"
            style={{ fontFamily: "IBMPlexMono_500Medium" }}
          >
            {isEditing ? "Save Changes" : "Create Rhythm"}
          </Text>
        </PressableScale>
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

      {showDurationWheel && (
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
          visible
        />
      )}

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
