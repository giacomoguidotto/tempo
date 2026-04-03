import { useCallback, useRef } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const THUMB_SIZE = 22;
const TRACK_HEIGHT = 2;

interface RangeSliderProps {
  max: number;
  min: number;
  onValuesChange: (low: number, high: number) => void;
  step: number;
  valueHigh: number;
  valueLow: number;
}

export function RangeSlider({
  min,
  max,
  step,
  valueLow,
  valueHigh,
  onValuesChange,
}: RangeSliderProps) {
  const trackWidth = useRef(0);
  const lowFrac = (valueLow - min) / (max - min);
  const highFrac = (valueHigh - min) / (max - min);

  const lowOffset = useSharedValue(0);
  const highOffset = useSharedValue(0);

  const snap = useCallback(
    (frac: number) => {
      const raw = min + frac * (max - min);
      return Math.round(raw / step) * step;
    },
    [min, max, step]
  );

  const emitChange = useCallback(
    (newLow: number, newHigh: number) => {
      onValuesChange(
        Math.max(min, Math.min(newLow, newHigh - step)),
        Math.min(max, Math.max(newHigh, newLow + step))
      );
    },
    [min, max, step, onValuesChange]
  );

  const lowGesture = Gesture.Pan()
    .onUpdate((e) => {
      lowOffset.value = e.translationX;
    })
    .onEnd(() => {
      const w = trackWidth.current;
      if (w === 0) {
        return;
      }
      const newFrac = Math.max(0, Math.min(1, lowFrac + lowOffset.value / w));
      const snapped = snap(newFrac);
      lowOffset.value = 0;
      runOnJS(emitChange)(snapped, valueHigh);
    });

  const highGesture = Gesture.Pan()
    .onUpdate((e) => {
      highOffset.value = e.translationX;
    })
    .onEnd(() => {
      const w = trackWidth.current;
      if (w === 0) {
        return;
      }
      const newFrac = Math.max(0, Math.min(1, highFrac + highOffset.value / w));
      const snapped = snap(newFrac);
      highOffset.value = 0;
      runOnJS(emitChange)(valueLow, snapped);
    });

  const lowThumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: lowOffset.value,
      },
    ],
  }));

  const highThumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: highOffset.value,
      },
    ],
  }));

  return (
    <View
      onLayout={(e) => {
        trackWidth.current = e.nativeEvent.layout.width;
      }}
      style={{ height: 40, justifyContent: "center" }}
    >
      {/* Track background */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: TRACK_HEIGHT,
          borderRadius: 1,
          backgroundColor: "#2A2420",
        }}
      />
      {/* Active range */}
      <View
        style={{
          position: "absolute",
          left: `${lowFrac * 100}%`,
          right: `${(1 - highFrac) * 100}%`,
          height: TRACK_HEIGHT,
          borderRadius: 1,
          backgroundColor: "#C06730",
        }}
      />
      {/* Low thumb */}
      <GestureDetector gesture={lowGesture}>
        <Animated.View
          style={[
            {
              position: "absolute",
              left: `${lowFrac * 100}%`,
              marginLeft: -THUMB_SIZE / 2,
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: "#EDE6DA",
            },
            lowThumbStyle,
          ]}
        />
      </GestureDetector>
      {/* High thumb */}
      <GestureDetector gesture={highGesture}>
        <Animated.View
          style={[
            {
              position: "absolute",
              left: `${highFrac * 100}%`,
              marginLeft: -THUMB_SIZE / 2,
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: "#EDE6DA",
            },
            highThumbStyle,
          ]}
        />
      </GestureDetector>
    </View>
  );
}
