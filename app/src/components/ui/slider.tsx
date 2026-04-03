import { useCallback, useRef, useState } from "react";
import { type GestureResponderEvent, View } from "react-native";

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 2;
const HIT_SLOP = 12;

interface SliderProps {
  max: number;
  min: number;
  onDragEnd?: () => void;
  onDragStart?: () => void;
  onValueChange: (value: number) => void;
  snapPoints?: number[];
  value: number;
}

export function Slider({
  min,
  max,
  value,
  snapPoints,
  onDragStart,
  onDragEnd,
  onValueChange,
}: SliderProps) {
  const viewRef = useRef<View>(null);
  const layoutRef = useRef({ x: 0, width: 0 });
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

  function valueFromEvent(e: GestureResponderEvent): number {
    const x = e.nativeEvent.pageX - layoutRef.current.x;
    const f = Math.max(0, Math.min(1, x / layoutRef.current.width));
    return snap(min + f * (max - min));
  }

  function measure() {
    viewRef.current?.measureInWindow((x, _y, width) => {
      if (width > 0) {
        layoutRef.current = { x, width };
      }
    });
  }

  return (
    <View
      onLayout={measure}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        measure();
        setIsDragging(true);
        onDragStart?.();
        onValueChange(valueFromEvent(e));
      }}
      onResponderMove={(e) => onValueChange(valueFromEvent(e))}
      onResponderRelease={() => {
        setIsDragging(false);
        onDragEnd?.();
      }}
      onResponderTerminationRequest={() => false}
      onStartShouldSetResponder={() => true}
      ref={viewRef}
      style={{ height: THUMB_SIZE + HIT_SLOP * 2, justifyContent: "center" }}
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
        pointerEvents="none"
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
