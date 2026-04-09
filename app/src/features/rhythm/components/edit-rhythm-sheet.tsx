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
import { cancelRhythm, scheduleRhythm } from "@/features/beat/engine";
import { requestAlarmPermissions } from "@/features/beat/permissions";
import { syncStatusNotification } from "@/features/beat/status";
import { deleteRhythm, getAllRhythms, updateRhythm } from "../operations";
import type { IntensityLevel, Rhythm } from "../schemas";
import { rhythmsAtom } from "../store/atoms";
import { minutesToTime } from "../time-range";
import { RhythmFormFields } from "./rhythm-form-fields";

export interface EditRhythmSheetHandle {
  dismiss: () => void;
  open: (rhythm: Rhythm) => void;
  requestClose: () => void;
}

interface EditRhythmSheetProps {
  onDismiss?: () => void;
}

const SNAP_POINTS = ["60%", "90%"];

export const EditRhythmSheet = forwardRef(function EditRhythmSheet(
  { onDismiss }: EditRhythmSheetProps,
  ref: Ref<EditRhythmSheetHandle>
) {
  const insets = useSafeAreaInsets();
  const setRhythms = useSetAtom(rhythmsAtom);
  const sheetRef = useRef<BottomSheetModal>(null);
  const nameRef = useRef("");
  const originalRef = useRef<Rhythm | null>(null);
  const isDirtyRef = useRef(false);
  const allowDismissRef = useRef(false);
  const [nameInputKey, setNameInputKey] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
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
    open(rhythm: Rhythm) {
      setNameInputKey((current) => current + 1);
      nameRef.current = rhythm.name;
      originalRef.current = rhythm;
      setEditingId(rhythm.id);
      setHasName(rhythm.name.trim().length > 0);
      setNameDirty(false);
      setSelectedDays(rhythm.days);
      setStartTime(rhythm.startTime);
      setEndTime(rhythm.endTime);
      setInterval(rhythm.intervalMinutes);
      setIntensity(rhythm.intensity);
      sheetRef.current?.present();
    },
    requestClose() {
      handleClose();
    },
  }));

  const canSave = hasName && selectedDays.length > 0;

  async function handleSave() {
    if (!(canSave && editingId)) {
      return;
    }
    const trimmedName = nameRef.current.trim();
    if (!trimmedName) {
      return;
    }
    const updated = updateRhythm(editingId, {
      name: trimmedName,
      days: selectedDays,
      startTime,
      endTime,
      intervalMinutes: interval,
      intensity,
    });
    if (updated) {
      if (updated.enabled) {
        const granted = await requestAlarmPermissions({
          presentPrompt: presentPermissionPrompt,
          requireFullScreen:
            updated.intensity === "pulse" || updated.intensity === "call",
        });
        if (!granted) {
          return;
        }
      }
      await scheduleRhythm(updated, "edit-rhythm");
    }
    setRhythms(getAllRhythms());
    allowDismissRef.current = true;
    sheetRef.current?.dismiss();
  }

  async function handleDelete() {
    if (!editingId) {
      return;
    }

    await cancelRhythm(editingId);
    deleteRhythm(editingId);
    setRhythms(getAllRhythms());
    await syncStatusNotification("edit-delete");
    allowDismissRef.current = true;
    sheetRef.current?.dismiss();
  }

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

  const isDirty =
    originalRef.current !== null &&
    (nameDirty ||
      interval !== originalRef.current.intervalMinutes ||
      startTime !== originalRef.current.startTime ||
      endTime !== originalRef.current.endTime ||
      intensity !== originalRef.current.intensity ||
      JSON.stringify(selectedDays) !==
        JSON.stringify(originalRef.current.days));

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

    const nextDirty = value !== (originalRef.current?.name ?? "");
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
          Edit Rhythm
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
        className="flex-row gap-3 px-7 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 32) }}
      >
        <Pressable
          className="items-center justify-center rounded-2xl border border-border px-5 py-5"
          onPress={handleDelete}
        >
          <Trash2 color="#7A6F63" size={20} />
        </Pressable>
        <Pressable
          className={`flex-1 items-center rounded-2xl py-5 ${canSave ? "bg-accent" : "bg-border"}`}
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
