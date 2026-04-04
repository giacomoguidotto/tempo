import WheelPickerBase from "@quidone/react-native-wheel-picker";

const WheelPicker = WheelPickerBase as React.ComponentType<
  Record<string, unknown>
>;

import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const HOURS_24 = Array.from({ length: 24 }, (_, i) => ({
  label: String(i).padStart(2, "0"),
  value: i,
}));

const MINUTES_60 = Array.from({ length: 60 }, (_, i) => ({
  label: String(i).padStart(2, "0"),
  value: i,
}));

const HOURS_3 = Array.from({ length: 3 }, (_, i) => ({
  label: String(i).padStart(2, "0"),
  value: i,
}));

const WHEEL_STYLE = {
  width: 80,
  height: 160,
};

const ITEM_STYLE = {
  fontFamily: "IBMPlexMono_500Medium",
  fontSize: 22,
  color: "#4A433C",
};

const OVERLAY_STYLE = {
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: "#3D352E",
};

function PickerModal({
  visible,
  title,
  onClose,
  children,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  onConfirm: () => void;
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
        <TouchableWithoutFeedback onPress={onClose}>
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
            backgroundColor: "#1A1714",
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
            <Pressable
              onPress={onClose}
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
            </Pressable>
            <Pressable
              onPress={onConfirm}
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
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- Time Picker Modal (for FROM / TO) ---

interface TimePickerModalProps {
  onClose: () => void;
  onConfirm: (time: string) => void;
  value: string;
  visible: boolean;
}

export function TimePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
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
        <WheelPicker
          data={HOURS_24}
          infiniteScroll
          itemHeight={44}
          itemTextStyle={ITEM_STYLE}
          onValueChanged={({ item }: { item: { value: number } }) =>
            setDraftH(item.value)
          }
          overlayItemStyle={OVERLAY_STYLE}
          selectedIndicatorStyle={{ backgroundColor: "transparent" }}
          value={draftH}
          visibleItemCount={3}
          width={WHEEL_STYLE.width}
        />
        <Text
          style={{
            fontFamily: "IBMPlexMono_500Medium",
            fontSize: 26,
            color: "#7A6F63",
          }}
        >
          :
        </Text>
        <WheelPicker
          data={MINUTES_60}
          infiniteScroll
          itemHeight={44}
          itemTextStyle={ITEM_STYLE}
          onValueChanged={({ item }: { item: { value: number } }) =>
            setDraftM(item.value)
          }
          overlayItemStyle={OVERLAY_STYLE}
          selectedIndicatorStyle={{ backgroundColor: "transparent" }}
          value={draftM}
          visibleItemCount={3}
          width={WHEEL_STYLE.width}
        />
      </View>
    </PickerModal>
  );
}

// --- Duration Picker Modal (for interval) ---

interface DurationPickerModalProps {
  onClose: () => void;
  onConfirm: (totalMinutes: number) => void;
  value: number;
  visible: boolean;
}

export function DurationPickerModal({
  visible,
  value,
  onConfirm,
  onClose,
}: DurationPickerModalProps) {
  const [draftH, setDraftH] = useState(Math.floor(value / 60));
  const [draftM, setDraftM] = useState(value % 60);

  useEffect(() => {
    if (visible) {
      setDraftH(Math.floor(value / 60));
      setDraftM(value % 60);
    }
  }, [visible, value]);

  return (
    <PickerModal
      onClose={onClose}
      onConfirm={() => {
        onConfirm(Math.max(1, draftH * 60 + draftM));
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
        <WheelPicker
          data={HOURS_3}
          itemHeight={44}
          itemTextStyle={ITEM_STYLE}
          onValueChanged={({ item }: { item: { value: number } }) =>
            setDraftH(item.value)
          }
          overlayItemStyle={OVERLAY_STYLE}
          selectedIndicatorStyle={{ backgroundColor: "transparent" }}
          value={draftH}
          visibleItemCount={3}
          width={WHEEL_STYLE.width}
        />
        <Text
          style={{
            fontFamily: "IBMPlexMono_500Medium",
            fontSize: 26,
            color: "#7A6F63",
          }}
        >
          :
        </Text>
        <WheelPicker
          data={MINUTES_60}
          infiniteScroll
          itemHeight={44}
          itemTextStyle={ITEM_STYLE}
          onValueChanged={({ item }: { item: { value: number } }) =>
            setDraftM(item.value)
          }
          overlayItemStyle={OVERLAY_STYLE}
          selectedIndicatorStyle={{ backgroundColor: "transparent" }}
          value={draftM}
          visibleItemCount={3}
          width={WHEEL_STYLE.width}
        />
      </View>
    </PickerModal>
  );
}
