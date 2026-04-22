import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const EASE = Easing.inOut(Easing.sin);
const VIEWBOX = 24;
const BAR_W = 2;
const BAR_R = 1;
const BAR_BOTTOM = 20;

interface BarDef {
  base: number;
  delay: number;
  max: number;
  x: number;
}

const BARS: BarDef[] = [
  { x: 6, base: 4, max: 8, delay: 0 },
  { x: 12, base: 10, max: 14, delay: 60 },
  { x: 18, base: 16, max: 20, delay: 120 },
];

function Bar({
  beat,
  color,
  config,
  s,
}: {
  beat: number;
  color: string;
  config: BarDef;
  s: number;
}) {
  const sy = useSharedValue(1);

  useEffect(() => {
    if (beat > 0) {
      sy.value = withDelay(
        config.delay,
        withSequence(
          withTiming(config.max / config.base, {
            duration: 350,
            easing: EASE,
          }),
          withTiming(1, { duration: 450, easing: EASE })
        )
      );
    }
  }, [beat, config, sy]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: sy.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: (config.x - BAR_W / 2) * s,
          bottom: (VIEWBOX - BAR_BOTTOM) * s,
          width: BAR_W * s,
          height: config.base * s,
          borderRadius: BAR_R * s,
          backgroundColor: color,
          transformOrigin: "bottom",
        },
        animStyle,
      ]}
    />
  );
}

export function BarChartIcon({
  beat = 0,
  color,
  size,
}: {
  beat?: number;
  color: string;
  size: number;
}) {
  const s = size / VIEWBOX;
  return (
    <View style={{ width: size, height: size }}>
      {BARS.map((config) => (
        <Bar beat={beat} color={color} config={config} key={config.x} s={s} />
      ))}
    </View>
  );
}
