import { useRef, useState } from "react";
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  View,
} from "react-native";

const THUMB_SIZE = 24;
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
  const trackLayout = useRef({ x: 0, width: 0 });
  const [dragging, setDragging] = useState<"low" | "high" | null>(null);

  const lowFrac = (valueLow - min) / (max - min);
  const highFrac = (valueHigh - min) / (max - min);

  function snap(raw: number): number {
    return Math.round(raw / step) * step;
  }

  function fracFromEvent(e: GestureResponderEvent): number {
    const x = e.nativeEvent.pageX - trackLayout.current.x;
    return Math.max(0, Math.min(1, x / trackLayout.current.width));
  }

  function handleLayout(e: LayoutChangeEvent) {
    e.target.measureInWindow((x, _y, width) => {
      trackLayout.current = { x, width };
    });
  }

  function handleStart(e: GestureResponderEvent) {
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
      const clamped = Math.min(snapped, valueHigh - step);
      onValuesChange(Math.max(min, clamped), valueHigh);
    } else {
      const clamped = Math.max(snapped, valueLow + step);
      onValuesChange(valueLow, Math.min(max, clamped));
    }
  }

  function handleEnd() {
    setDragging(null);
  }

  return (
    <View
      onLayout={handleLayout}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleStart}
      onResponderMove={handleMove}
      onResponderRelease={handleEnd}
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
          left: `${lowFrac * 100}%`,
          right: `${(1 - highFrac) * 100}%`,
          height: TRACK_HEIGHT,
          borderRadius: 1,
          backgroundColor: "#C06730",
        }}
      />
      <View
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
