import { useRef, useState } from "react";
import { View } from "react-native";
import {
  Gesture,
  GestureDetector,
  type GestureUpdateEvent,
  type PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";

const THUMB_SIZE = 32;
const TRACK_HEIGHT = 6;
const HIT_SLOP = 20;

interface RangeSliderProps {
  max: number;
  min: number;
  onDragEnd?: () => void;
  onDragStart?: () => void;
  onValuesChange: (low: number, high: number) => void;
  step: number;
  valueHigh: number;
  valueLow: number;
}

export function RangeSlider({
  min,
  max,
  step,
  onDragStart,
  onDragEnd,
  valueLow,
  valueHigh,
  onValuesChange,
}: RangeSliderProps) {
  const viewRef = useRef<View>(null);
  const layoutRef = useRef({ x: 0, width: 0 });
  const activeThumbRef = useRef<"low" | "high" | null>(null);
  const [dragging, setDragging] = useState<"low" | "high" | null>(null);

  const lowFrac = (valueLow - min) / (max - min);
  const highFrac = (valueHigh - min) / (max - min);
  const wraps = valueLow > valueHigh;

  function snap(raw: number): number {
    const maxStepValue = Math.floor(max / step) * step;
    return Math.max(min, Math.min(maxStepValue, Math.round(raw / step) * step));
  }

  function fracFromAbsoluteX(absoluteX: number): number {
    const x = absoluteX - layoutRef.current.x;
    return Math.max(0, Math.min(1, x / layoutRef.current.width));
  }

  function measure() {
    viewRef.current?.measureInWindow((x, _y, width) => {
      if (width > 0) {
        layoutRef.current = { x, width };
      }
    });
  }

  function resolveDraggingThumb(absoluteX: number): "low" | "high" {
    measure();
    const frac = fracFromAbsoluteX(absoluteX);
    const distToLow = Math.abs(frac - lowFrac);
    const distToHigh = Math.abs(frac - highFrac);
    return distToLow <= distToHigh ? "low" : "high";
  }

  function handleMoveAbsoluteX(
    absoluteX: number,
    thumb: "low" | "high" | null
  ) {
    if (!thumb) {
      return;
    }
    const frac = fracFromAbsoluteX(absoluteX);
    const raw = min + frac * (max - min);
    const snapped = snap(raw);

    if (thumb === "low") {
      onValuesChange(Math.max(min, Math.min(snapped, max)), valueHigh);
    } else {
      onValuesChange(valueLow, Math.max(min, Math.min(snapped, max)));
    }
  }

  function handleRelease() {
    activeThumbRef.current = null;
    setDragging(null);
    onDragEnd?.();
  }

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .shouldCancelWhenOutside(false)
    .onBegin((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      const thumb = resolveDraggingThumb(event.absoluteX);
      activeThumbRef.current = thumb;
      setDragging(thumb);
      onDragStart?.();
      handleMoveAbsoluteX(event.absoluteX, thumb);
    })
    .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      handleMoveAbsoluteX(event.absoluteX, activeThumbRef.current);
    })
    .onFinalize(() => {
      handleRelease();
    });

  function renderActiveTrack() {
    if (!wraps) {
      return (
        <View
          style={{
            position: "absolute",
            left: `${lowFrac * 100}%`,
            right: `${(1 - highFrac) * 100}%`,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: "#C06730",
          }}
        />
      );
    }

    return (
      <>
        <View
          style={{
            position: "absolute",
            left: 0,
            right: `${(1 - highFrac) * 100}%`,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: "#C06730",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: `${lowFrac * 100}%`,
            right: 0,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: "#C06730",
          }}
        />
      </>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <View
        accessibilityLabel="Time range slider"
        accessibilityRole="adjustable"
        onLayout={measure}
        ref={viewRef}
        style={{ height: THUMB_SIZE + HIT_SLOP * 2, justifyContent: "center" }}
      >
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: "#2A2420",
          }}
        />
        {renderActiveTrack()}
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
            borderWidth: 2,
            borderColor: dragging === "low" ? "#C06730" : "#3D352E",
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
            borderWidth: 2,
            borderColor: dragging === "high" ? "#C06730" : "#3D352E",
          }}
        />
      </View>
    </GestureDetector>
  );
}
