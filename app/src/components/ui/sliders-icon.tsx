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
const TRACK_W = 2;
const TICK_W = 6;
const GAP = 2;
const TRACK_TOP = 3;
const TRACK_BOT = 21;

interface SliderDef {
  delay: number;
  knobY: number;
  travel: number;
  x: number;
}

const SLIDERS: SliderDef[] = [
  { x: 4, knobY: 12, travel: -5, delay: 0 },
  { x: 12, knobY: 10, travel: 6, delay: 80 },
  { x: 20, knobY: 14, travel: -4, delay: 160 },
];

function Slider({
  beat,
  color,
  config,
  s,
}: {
  beat: number;
  color: string;
  config: SliderDef;
  s: number;
}) {
  const r = (TRACK_W / 2) * s;
  const offset = useSharedValue(0);

  useEffect(() => {
    if (beat > 0) {
      offset.value = withDelay(
        config.delay,
        withSequence(
          withTiming(config.travel, { duration: 200, easing: EASE }),
          withTiming(-config.travel * 0.3, { duration: 250, easing: EASE }),
          withTiming(0, { duration: 200, easing: EASE })
        )
      );
    }
  }, [beat, config, offset]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value * s }],
  }));

  const topTrackStyle = useAnimatedStyle(() => ({
    height: (config.knobY - GAP - TRACK_TOP + offset.value) * s,
  }));

  const botTrackStyle = useAnimatedStyle(() => ({
    top: (config.knobY + GAP + offset.value) * s,
    height: (TRACK_BOT - config.knobY - GAP - offset.value) * s,
  }));

  return (
    <>
      <Animated.View
        style={[
          {
            position: "absolute",
            left: (config.x - TRACK_W / 2) * s,
            top: TRACK_TOP * s,
            width: TRACK_W * s,
            borderRadius: r,
            backgroundColor: color,
          },
          topTrackStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            left: (config.x - TRACK_W / 2) * s,
            width: TRACK_W * s,
            borderRadius: r,
            backgroundColor: color,
          },
          botTrackStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            left: (config.x - TICK_W / 2) * s,
            top: (config.knobY - TRACK_W / 2) * s,
            width: TICK_W * s,
            height: TRACK_W * s,
            borderRadius: r,
            backgroundColor: color,
          },
          knobStyle,
        ]}
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
  return (
    <View style={{ width: size, height: size }}>
      {SLIDERS.map((config) => (
        <Slider
          beat={beat}
          color={color}
          config={config}
          key={config.x}
          s={s}
        />
      ))}
    </View>
  );
}
