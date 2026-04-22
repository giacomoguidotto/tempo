import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const VIEWBOX = 24;
const TRACK_W = 2;
const TICK_W = 6;
const GAP = 2;

function StaticTrack({
  color,
  knobY,
  s,
  x,
}: {
  color: string;
  knobY: number;
  s: number;
  x: number;
}) {
  const r = (TRACK_W / 2) * s;
  return (
    <>
      <View
        style={{
          position: "absolute",
          left: (x - TRACK_W / 2) * s,
          top: 3 * s,
          width: TRACK_W * s,
          height: (knobY - GAP - 3) * s,
          borderRadius: r,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: (x - TRACK_W / 2) * s,
          top: (knobY + GAP) * s,
          width: TRACK_W * s,
          height: (21 - knobY - GAP) * s,
          borderRadius: r,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: (x - TICK_W / 2) * s,
          top: (knobY - TRACK_W / 2) * s,
          width: TICK_W * s,
          height: TRACK_W * s,
          borderRadius: r,
          backgroundColor: color,
        }}
      />
    </>
  );
}

export function SlidersIcon({
  beat = 0,
  color,
  size,
}: {
  beat?: number;
  color: string;
  size: number;
}) {
  const s = size / VIEWBOX;
  const sc = useSharedValue(1);

  useEffect(() => {
    if (beat > 0) {
      sc.value = withSequence(
        withTiming(1.15, {
          duration: 150,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(1, { duration: 250, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [beat, sc]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sc.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]}>
      <StaticTrack color={color} knobY={12} s={s} x={4} />
      <StaticTrack color={color} knobY={10} s={s} x={12} />
      <StaticTrack color={color} knobY={14} s={s} x={20} />
    </Animated.View>
  );
}
