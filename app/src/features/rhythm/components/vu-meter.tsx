import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const VISIBLE = 11;
const TOTAL = VISIBLE * 3;
const BAR_W = 4.5;
const GAP = 3;
const STEP = BAR_W + GAP;
const VISIBLE_W = VISIBLE * STEP - GAP;
const CENTER = VISIBLE_W / 2;
const MAX_HEIGHT = 110;
const MIN_HEIGHT = 22;
const IDLE_SCALE = 0.25;
const CYCLE_DURATION = 12_000;

const COLOR_IDLE = "rgba(192, 103, 48, 0.15)";
const COLOR_DIM = "#3D2E22";
const COLOR_BRIGHT = "#C06730";
const TRANSITION_MS = 1500;

function AnimatedBar({
  active,
  index,
  phase,
}: {
  active: boolean;
  index: number;
  phase: SharedValue<number>;
}) {
  const idleScale = useSharedValue(active ? 1 : IDLE_SCALE);
  const activeProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    idleScale.value = withTiming(active ? 1 : IDLE_SCALE, {
      duration: TRANSITION_MS,
    });
    activeProgress.value = withTiming(active ? 1 : 0, {
      duration: TRANSITION_MS,
    });
  }, [active, idleScale, activeProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const totalW = TOTAL * STEP;
    const rawX = index * STEP - phase.value * STEP;
    const wrappedX = ((rawX % totalW) + totalW) % totalW;
    const screenX = wrappedX - ((TOTAL - VISIBLE) / 2) * STEP;

    const isVisible = screenX >= -STEP && screenX <= VISIBLE_W + STEP;

    if (!isVisible) {
      return {
        height: 0,
        opacity: 0,
        backgroundColor: COLOR_IDLE,
        transform: [{ translateX: 0 }],
      };
    }

    const barCenter = screenX + BAR_W / 2;
    const dist = Math.min(Math.abs(barCenter - CENTER) / CENTER, 1);
    const factor = (Math.cos(dist * Math.PI) + 1) / 2;

    const height = MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * factor;
    const opacity = 0.25 + 0.75 * factor;
    const activeColor = interpolateColor(
      factor,
      [0, 1],
      [COLOR_DIM, COLOR_BRIGHT]
    );
    const color = interpolateColor(
      activeProgress.value,
      [0, 1],
      [COLOR_IDLE, activeColor]
    );

    return {
      height: height * idleScale.value,
      opacity: active ? opacity : 0.5,
      backgroundColor: color,
      transform: [{ translateX: screenX - index * STEP }],
    };
  });

  return (
    <Animated.View
      className="absolute rounded-sm"
      style={[{ bottom: 0, left: index * STEP, width: BAR_W }, animatedStyle]}
    />
  );
}

export function VuMeter({ active = true }: { active?: boolean }) {
  const phase = useSharedValue(0);

  // Phase always runs — bars always scroll. Active state only affects scale/color.
  useEffect(() => {
    phase.value = withRepeat(
      withTiming(TOTAL, {
        duration: CYCLE_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [phase]);

  return (
    <View
      className="items-center justify-end"
      style={{ height: MAX_HEIGHT + 8 }}
    >
      <View
        style={{
          width: VISIBLE_W,
          height: MAX_HEIGHT,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: TOTAL }).map((_, i) => (
          <AnimatedBar
            active={active}
            index={i}
            // biome-ignore lint/suspicious/noArrayIndexKey: static bar list
            key={i}
            phase={phase}
          />
        ))}
      </View>
    </View>
  );
}
