import { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelColumnProps {
  items: { label: string; value: number }[];
  onChange: (value: number) => void;
  selectedValue: number;
}

function WheelColumn({ items, selectedValue, onChange }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(
    0,
    items.findIndex((i) => i.value === selectedValue)
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [selectedIndex]);

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, items.length - 1));
      if (items[clamped].value !== selectedValue) {
        onChange(items[clamped].value);
      }
    },
    [items, onChange, selectedValue]
  );

  return (
    <View style={{ height: PICKER_HEIGHT, flex: 1, overflow: "hidden" }}>
      <ScrollView
        decelerationRate="fast"
        nestedScrollEnabled
        onMomentumScrollEnd={handleMomentumEnd}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
      >
        {/* Top padding (1 empty slot) */}
        <View style={{ height: ITEM_HEIGHT }} />

        {items.map((item, i) => {
          const isSelected = i === selectedIndex;
          return (
            <View
              key={item.value}
              style={{
                height: ITEM_HEIGHT,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "IBMPlexMono_500Medium",
                  fontSize: isSelected ? 24 : 18,
                  color: isSelected ? "#EDE6DA" : "#4A433C",
                }}
              >
                {item.label}
              </Text>
            </View>
          );
        })}

        {/* Bottom padding (1 empty slot) */}
        <View style={{ height: ITEM_HEIGHT }} />
      </ScrollView>

      {/* Selection indicator lines */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: ITEM_HEIGHT,
          left: 8,
          right: 8,
          height: ITEM_HEIGHT,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: "#3D352E",
        }}
      />
    </View>
  );
}

interface DurationPickerProps {
  onChange: (totalMinutes: number) => void;
  value: number;
}

const HOURS = Array.from({ length: 3 }, (_, i) => ({
  label: String(i).padStart(2, "0"),
  value: i,
}));

const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  label: String(i).padStart(2, "0"),
  value: i,
}));

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  const roundedMinutes = minutes;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: PICKER_HEIGHT,
        backgroundColor: "#1A1714",
        borderRadius: 12,
        paddingHorizontal: 8,
      }}
    >
      <WheelColumn
        items={HOURS}
        onChange={(h) => onChange(h * 60 + roundedMinutes)}
        selectedValue={hours}
      />
      <Text
        style={{
          fontFamily: "IBMPlexMono_500Medium",
          fontSize: 24,
          color: "#7A6F63",
          paddingHorizontal: 4,
        }}
      >
        :
      </Text>
      <WheelColumn
        items={MINUTES}
        onChange={(m) => onChange(hours * 60 + m)}
        selectedValue={roundedMinutes}
      />
    </View>
  );
}

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
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
        }}
      >
        <View
          onStartShouldSetResponder={() => true}
          style={{
            backgroundColor: "#1A1714",
            borderRadius: 20,
            paddingTop: 20,
            paddingBottom: 12,
            paddingHorizontal: 16,
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
              marginBottom: 8,
            }}
          >
            Interval
          </Text>

          <DurationPicker onChange={setDraft} value={draft} />

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
              onPress={() => {
                onConfirm(Math.max(1, draft));
                onClose();
              }}
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
      </Pressable>
    </Modal>
  );
}
