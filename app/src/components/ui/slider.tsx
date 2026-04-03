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

interface SliderProps {
  max: number;
  min: number;
  onValueChange: (value: number) => void;
  snapPoints?: number[];
  value: number;
}

export function Slider({
  min,
  max,
  value,
  snapPoints,
  onValueChange,
}: SliderProps) {
  const trackWidth = useRef(0);
  const frac = (value - min) / (max - min);
  const offset = useSharedValue(0);

  const snap = useCallback(
    (rawValue: number) => {
      if (snapPoints && snapPoints.length > 0) {
        let closest = snapPoints[0];
        let closestDist = Math.abs(rawValue - closest);
        for (const sp of snapPoints) {
          const dist = Math.abs(rawValue - sp);
          if (dist < closestDist) {
            closest = sp;
            closestDist = dist;
          }
        }
        return closest;
      }
      return Math.round(rawValue);
    },
    [snapPoints]
  );

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      offset.value = e.translationX;
    })
    .onEnd(() => {
      const w = trackWidth.current;
      if (w === 0) {
        return;
      }
      const newFrac = Math.max(0, Math.min(1, frac + offset.value / w));
      const raw = min + newFrac * (max - min);
      const snapped = snap(raw);
      offset.value = 0;
      runOnJS(onValueChange)(snapped);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
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
      {/* Filled portion */}
      <View
        style={{
          position: "absolute",
          left: 0,
          width: `${frac * 100}%`,
          height: TRACK_HEIGHT,
          borderRadius: 1,
          backgroundColor: "#C06730",
        }}
      />
      {/* Thumb */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            {
              position: "absolute",
              left: `${frac * 100}%`,
              marginLeft: -THUMB_SIZE / 2,
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: "#EDE6DA",
            },
            thumbStyle,
          ]}
        />
      </GestureDetector>
    </View>
  );
}
