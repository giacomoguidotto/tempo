import { useRef, useState } from "react";
import { type GestureResponderEvent, View } from "react-native";

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 2;
const HIT_SLOP = 12;

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
  const viewRef = useRef<View>(null);
  const layoutRef = useRef({ x: 0, width: 0 });
  const [dragging, setDragging] = useState<"low" | "high" | null>(null);

  const lowFrac = (valueLow - min) / (max - min);
  const highFrac = (valueHigh - min) / (max - min);

  function snap(raw: number): number {
    return Math.round(raw / step) * step;
  }

  function fracFromEvent(e: GestureResponderEvent): number {
    const x = e.nativeEvent.pageX - layoutRef.current.x;
    return Math.max(0, Math.min(1, x / layoutRef.current.width));
  }

  function measure() {
    viewRef.current?.measureInWindow((x, _y, width) => {
      if (width > 0) {
        layoutRef.current = { x, width };
      }
    });
  }

  function handleGrant(e: GestureResponderEvent) {
    measure();
    const frac = fracFromEvent(e);
    const distToLow = Math.abs(frac - lowFrac);
    const distToHigh = Math.abs(frac - highFrac);
    setDragging(distToLow <= distToHigh ? "low" : "high");
  }

  function handleMove(e: GestureResponderEvent) {
    if (!dragging) {
      return;
    }
    const frac = fracFromEvent(e);
    const raw = min + frac * (max - min);
    const snapped = snap(raw);

    if (dragging === "low") {
      const clamped = Math.max(min, Math.min(snapped, valueHigh - step));
      onValuesChange(clamped, valueHigh);
    } else {
      const clamped = Math.min(max, Math.max(snapped, valueLow + step));
      onValuesChange(valueLow, clamped);
    }
  }

  return (
    <View
      onLayout={measure}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      onResponderRelease={() => setDragging(null)}
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
          left: `${lowFrac * 100}%`,
          right: `${(1 - highFrac) * 100}%`,
          height: TRACK_HEIGHT,
          borderRadius: 1,
          backgroundColor: "#C06730",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: `${lowFrac * 100}%`,
          marginLeft: -THUMB_SIZE / 2,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          backgroundColor: dragging === "low" ? "#FFFFFF" : "#EDE6DA",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: `${highFrac * 100}%`,
          marginLeft: -THUMB_SIZE / 2,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          backgroundColor: dragging === "high" ? "#FFFFFF" : "#EDE6DA",
        }}
      />
    </View>
  );
}
