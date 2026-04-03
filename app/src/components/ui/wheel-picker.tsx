import { useCallback, useRef } from "react";
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
  const listRef = useRef<FlatList>(null);
  const selectedIndex = items.findIndex((i) => i.value === selectedValue);
  const paddedItems = [
    { label: "", value: -1 },
    ...items,
    { label: "", value: -2 },
  ];

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, items.length - 1));
      onChange(items[clamped].value);
    },
    [items, onChange]
  );

  return (
    <View style={{ height: PICKER_HEIGHT, flex: 1, overflow: "hidden" }}>
      <FlatList
        contentOffset={{ x: 0, y: Math.max(0, selectedIndex) * ITEM_HEIGHT }}
        data={paddedItems}
        decelerationRate="fast"
        getItemLayout={(_data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        keyExtractor={(item, i) => `${item.value}-${i}`}
        onMomentumScrollEnd={handleMomentumEnd}
        ref={listRef}
        renderItem={({ item, index }) => {
          const realIndex = index - 1;
          const isSelected = realIndex === selectedIndex;
          const isEmpty = item.value < 0;
          return (
            <View
              style={{
                height: ITEM_HEIGHT,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {!isEmpty && (
                <Text
                  style={{
                    fontFamily: "IBMPlexMono_500Medium",
                    fontSize: isSelected ? 24 : 18,
                    color: isSelected ? "#EDE6DA" : "#4A433C",
                  }}
                >
                  {item.label}
                </Text>
              )}
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
      />
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

const MINUTES = Array.from({ length: 12 }, (_, i) => ({
  label: String(i * 5).padStart(2, "0"),
  value: i * 5,
}));

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  const roundedMinutes = Math.round(minutes / 5) * 5;

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
