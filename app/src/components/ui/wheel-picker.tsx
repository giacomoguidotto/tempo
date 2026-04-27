import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { PressableScale } from "./pressable-scale";

// ── Constants ──────────────────────────────────────────────────────────────────

const ITEM_H = 44;
const VISIBLE = 3;
const WHEEL_H = ITEM_H * VISIBLE;
const COL_W = 80;
const PAD = Math.floor(VISIBLE / 2); // 1 empty slot above & below
const BG = "#1A1714";
const FADE_OPACITY = 0.65;

interface WheelItem {
  label: string;
  value: number;
}

// ── WheelColumn ────────────────────────────────────────────────────────────────

const getItemLayout = (_: unknown, index: number) => ({
  index,
  length: ITEM_H,
  offset: ITEM_H * index,
});

const ItemCell = React.memo(function ItemCell({
  item,
}: {
  item: WheelItem | null;
}) {
  return (
    <View
      style={{ height: ITEM_H, justifyContent: "center", alignItems: "center" }}
    >
      {item && (
        <Text
          style={{
            fontFamily: "IBMPlexMono_500Medium",
            fontSize: 22,
            color: "#EDE6DA",
          }}
        >
          {item.label}
        </Text>
      )}
    </View>
  );
});

function WheelColumn({
  data,
  onValueChange,
  value,
}: {
  data: WheelItem[];
  onValueChange: (v: number) => void;
  value: number;
}) {
  const listRef = useRef<FlatList>(null);
  const isUserScroll = useRef(false);
  const hasMounted = useRef(false);

  const valueIndex = Math.max(
    0,
    data.findIndex((d) => d.value === value)
  );

  const paddedData: (WheelItem | null)[] = [null, ...data, null];

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, data.length - 1));
      isUserScroll.current = true;
      onValueChange(data[clamped].value);
    },
    [data, onValueChange]
  );

  useEffect(() => {
    const idx = data.findIndex((d) => d.value === value);
    if (idx < 0) {
      return;
    }

    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (isUserScroll.current) {
      isUserScroll.current = false;
      return;
    }

    listRef.current?.scrollToOffset({ offset: idx * ITEM_H, animated: true });
  }, [value, data]);

  const renderItem = useCallback(
    ({ item }: { item: WheelItem | null }) => <ItemCell item={item} />,
    []
  );

  return (
    <View style={{ width: COL_W, height: WHEEL_H, overflow: "hidden" }}>
      <FlatList
        data={paddedData}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        initialNumToRender={VISIBLE + 2}
        initialScrollIndex={valueIndex}
        maxToRenderPerBatch={VISIBLE + 2}
        onMomentumScrollEnd={handleScrollEnd}
        ref={listRef}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        windowSize={3}
      />
      {/* Top fade */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: ITEM_H,
          backgroundColor: BG,
          opacity: FADE_OPACITY,
        }}
      />
      {/* Bottom fade */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: ITEM_H,
          backgroundColor: BG,
          opacity: FADE_OPACITY,
        }}
      />
      {/* Selection indicator */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: PAD * ITEM_H,
          left: 0,
          right: 0,
          height: ITEM_H,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: "#3D352E",
        }}
      />
    </View>
  );
}

// ── PickerModal ────────────────────────────────────────────────────────────────

function PickerModal({
  children,
  onClose,
  onConfirm,
  title,
  visible,
}: {
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableWithoutFeedback
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
          onPress={onClose}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
            }}
          />
        </TouchableWithoutFeedback>
        <View
          style={{
            backgroundColor: BG,
            borderRadius: 20,
            paddingTop: 20,
            paddingBottom: 12,
            paddingHorizontal: 20,
            width: 280,
            borderWidth: 1,
            borderColor: "#2A2420",
          }}
        >
          <Text
            style={{
              fontFamily: "IBMPlexMono_400Regular",
              fontSize: 10,
              letterSpacing: 2,
              color: "#7A6F63",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {title}
          </Text>

          {children}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 16,
              marginTop: 16,
              paddingHorizontal: 4,
            }}
          >
            <PressableScale
              accessibilityLabel="Cancel"
              accessibilityRole="button"
              onPress={onClose}
              scale={0.88}
              style={{ paddingVertical: 8, paddingHorizontal: 12 }}
            >
              <Text
                style={{
                  fontFamily: "IBMPlexMono_500Medium",
                  fontSize: 13,
                  color: "#7A6F63",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Cancel
              </Text>
            </PressableScale>
            <PressableScale
              accessibilityLabel="Confirm"
              accessibilityRole="button"
              onPress={onConfirm}
              scale={0.88}
              style={{ paddingVertical: 8, paddingHorizontal: 12 }}
            >
              <Text
                style={{
                  fontFamily: "IBMPlexMono_500Medium",
                  fontSize: 13,
                  color: "#C06730",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                OK
              </Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Time Picker Modal (FROM / TO) ──────────────────────────────────────────────

const HOURS_24: WheelItem[] = Array.from({ length: 24 }, (_, i) => ({
  label: String(i).padStart(2, "0"),
  value: i,
}));

const MINUTES_60: WheelItem[] = Array.from({ length: 60 }, (_, i) => ({
  label: String(i).padStart(2, "0"),
  value: i,
}));

interface TimePickerModalProps {
  onClose: () => void;
  onConfirm: (time: string) => void;
  value: string;
  visible: boolean;
}

export function TimePickerModal({
  onClose,
  onConfirm,
  value,
  visible,
}: TimePickerModalProps) {
  const [h, m] = value.split(":").map(Number);
  const [draftH, setDraftH] = useState(h);
  const [draftM, setDraftM] = useState(m);

  useEffect(() => {
    if (visible) {
      const [hh, mm] = value.split(":").map(Number);
      setDraftH(hh);
      setDraftM(mm);
    }
  }, [visible, value]);

  return (
    <PickerModal
      onClose={onClose}
      onConfirm={() => {
        onConfirm(
          `${String(draftH).padStart(2, "0")}:${String(draftM).padStart(2, "0")}`
        );
        onClose();
      }}
      title="Time"
      visible={visible}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <WheelColumn data={HOURS_24} onValueChange={setDraftH} value={draftH} />
        <Text
          style={{
            fontFamily: "IBMPlexMono_500Medium",
            fontSize: 26,
            color: "#7A6F63",
          }}
        >
          :
        </Text>
        <WheelColumn
          data={MINUTES_60}
          onValueChange={setDraftM}
          value={draftM}
        />
      </View>
    </PickerModal>
  );
}

// ── Duration Picker Modal (interval) ───────────────────────────────────────────

interface DurationPickerModalProps {
  max?: number;
  onClose: () => void;
  onConfirm: (totalMinutes: number) => void;
  value: number;
  visible: boolean;
}

function makeHours(max: number): WheelItem[] {
  return Array.from({ length: max + 1 }, (_, i) => ({
    label: String(i).padStart(2, "0"),
    value: i,
  }));
}

function makeMinutes(maxMin: number, minMin = 0): WheelItem[] {
  const count = Math.min(maxMin + 1, 60) - minMin;
  return Array.from({ length: count }, (_, i) => ({
    label: String(i + minMin).padStart(2, "0"),
    value: i + minMin,
  }));
}

export function DurationPickerModal({
  max = 480,
  onClose,
  onConfirm,
  value,
  visible,
}: DurationPickerModalProps) {
  const hours = makeHours(Math.floor(Math.max(max, 1) / 60));

  const [draftH, setDraftH] = useState(Math.floor(value / 60));
  const [draftM, setDraftM] = useState(value % 60);

  const effectiveMax = Math.max(max, 1);
  const effectiveMaxH = Math.floor(effectiveMax / 60);
  const maxMinForHour = draftH >= effectiveMaxH ? effectiveMax % 60 : 59;
  const minMinForHour = Math.min(draftH === 0 ? 1 : 0, maxMinForHour);
  const minutes =
    draftH >= effectiveMaxH || draftH === 0
      ? makeMinutes(maxMinForHour, minMinForHour)
      : MINUTES_60;

  useEffect(() => {
    if (visible) {
      setDraftH(Math.floor(value / 60));
      setDraftM(value % 60);
    }
  }, [visible, value]);

  useEffect(() => {
    if (draftM < minMinForHour) {
      setDraftM(minMinForHour);
    } else if (draftM > maxMinForHour) {
      setDraftM(maxMinForHour);
    }
  }, [draftM, minMinForHour, maxMinForHour]);

  return (
    <PickerModal
      onClose={onClose}
      onConfirm={() => {
        onConfirm(draftH * 60 + draftM);
        onClose();
      }}
      title="Interval"
      visible={visible}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <WheelColumn data={hours} onValueChange={setDraftH} value={draftH} />
        <Text
          style={{
            fontFamily: "IBMPlexMono_500Medium",
            fontSize: 26,
            color: "#8A7D70",
          }}
        >
          :
        </Text>
        <WheelColumn data={minutes} onValueChange={setDraftM} value={draftM} />
      </View>
    </PickerModal>
  );
}
