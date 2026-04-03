import { useCallback, useRef, useState } from "react";
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  View,
} from "react-native";

const THUMB_SIZE = 24;
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
  const trackLayout = useRef({ x: 0, width: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const frac = (value - min) / (max - min);

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

  function fracFromEvent(e: GestureResponderEvent): number {
    const x = e.nativeEvent.pageX - trackLayout.current.x;
    return Math.max(0, Math.min(1, x / trackLayout.current.width));
  }

  function handleLayout(e: LayoutChangeEvent) {
    e.target.measureInWindow((x, _y, width) => {
      trackLayout.current = { x, width };
    });
  }

  function handleMove(e: GestureResponderEvent) {
    const f = fracFromEvent(e);
    const raw = min + f * (max - min);
    onValueChange(snap(raw));
  }

  return (
    <View
      onLayout={handleLayout}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        setIsDragging(true);
        handleMove(e);
      }}
      onResponderMove={handleMove}
      onResponderRelease={() => setIsDragging(false)}
      onStartShouldSetResponder={() => true}
      style={{ height: 44, justifyContent: "center" }}
    >
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
      <View
        style={{
          position: "absolute",
          left: `${frac * 100}%`,
          marginLeft: -THUMB_SIZE / 2,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          backgroundColor: isDragging ? "#FFFFFF" : "#EDE6DA",
        }}
      />
    </View>
  );
}
