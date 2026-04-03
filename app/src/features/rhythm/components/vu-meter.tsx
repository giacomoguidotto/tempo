import { useEffect, useRef } from "react";
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

function computeScreenX(index: number, phaseVal: number): number {
  "worklet";
  const totalW = TOTAL * STEP;
  const rawX = index * STEP - phaseVal * STEP;
  const wrappedX = ((rawX % totalW) + totalW) % totalW;
  return wrappedX - ((TOTAL - VISIBLE) / 2) * STEP;
}

function AnimatedBar({
  active,
  index,
  phase,
  speed,
}: {
  active: boolean;
  index: number;
  phase: SharedValue<number>;
  speed: SharedValue<number>;
}) {
  const idleScale = useSharedValue(active ? 1 : IDLE_SCALE);
  const activeProgress = useSharedValue(active ? 1 : 0);
  const frozenPhase = useSharedValue(phase.value);

  const prevActive = useRef(active);

  useEffect(() => {
    if (!active && prevActive.current) {
      // Capture the current phase when deactivating
      frozenPhase.value = phase.value;
    }
    prevActive.current = active;

    idleScale.value = withTiming(active ? 1 : IDLE_SCALE, {
      duration: TRANSITION_MS,
    });
    activeProgress.value = withTiming(active ? 1 : 0, {
      duration: TRANSITION_MS,
    });
  }, [active, idleScale, activeProgress, frozenPhase, phase]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    // Blend between live phase and frozen phase based on speed
    const liveX = computeScreenX(index, phase.value);
    const frozenX = computeScreenX(index, frozenPhase.value);
    const screenX = frozenX + (liveX - frozenX) * speed.value;

    // Handle wrapping discontinuity — if the difference is too large, use live
    const diff = Math.abs(liveX - frozenX);
    const finalX = diff > VISIBLE_W ? liveX : screenX;

    const isVisible = finalX >= -STEP && finalX <= VISIBLE_W + STEP;

    if (!isVisible) {
      return {
        height: 0,
        opacity: 0,
        backgroundColor: COLOR_IDLE,
        transform: [{ translateX: 0 }],
      };
    }

    const barCenter = finalX + BAR_W / 2;
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
      opacity:
        activeProgress.value * opacity + (1 - activeProgress.value) * 0.5,
      backgroundColor: color,
      transform: [{ translateX: finalX - index * STEP }],
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
  const speed = useSharedValue(active ? 1 : 0);

  // Phase always runs
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

  // Speed ramps up/down with same duration as other transitions
  useEffect(() => {
    speed.value = withTiming(active ? 1 : 0, { duration: TRANSITION_MS });
  }, [active, speed]);

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
            speed={speed}
          />
        ))}
      </View>
    </View>
  );
}
