import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const VISIBLE = 11;
const TOTAL = VISIBLE * 3;
const BAR_W = 4;
const GAP = 4;
const STEP = BAR_W + GAP;
const VISIBLE_W = VISIBLE * STEP - GAP;
const CENTER = VISIBLE_W / 2;
const MAX_HEIGHT = 100;
const MIN_HEIGHT = 20;
const IDLE_SCALE = 0.25;
const CYCLE_DURATION = 12_000;

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

  useEffect(() => {
    idleScale.value = withTiming(active ? 1 : IDLE_SCALE, { duration: 600 });
  }, [active, idleScale]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const totalW = TOTAL * STEP;
    const rawX = index * STEP - phase.value * STEP;
    const wrappedX = ((rawX % totalW) + totalW) % totalW;
    const screenX = wrappedX - ((TOTAL - VISIBLE) / 2) * STEP;

    const isVisible = screenX >= -STEP && screenX <= VISIBLE_W + STEP;

    if (!isVisible) {
      return { height: 0, opacity: 0, transform: [{ translateX: 0 }] };
    }

    // Distance from center, normalized 0..1
    const barCenter = screenX + BAR_W / 2;
    const dist = Math.min(Math.abs(barCenter - CENTER) / CENTER, 1);
    const factor = (Math.cos(dist * Math.PI) + 1) / 2;

    const height = MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * factor;
    const opacity = 0.2 + 0.8 * factor;

    return {
      height: height * idleScale.value,
      opacity: active ? opacity : 0.12 + 0.18 * factor,
      transform: [{ translateX: screenX - index * STEP }],
    };
  });

  return (
    <Animated.View
      className="absolute w-1 rounded-sm bg-accent"
      style={[{ bottom: 0, left: index * STEP }, animatedStyle]}
    />
  );
}

export function VuMeter({ active = true }: { active?: boolean }) {
  const phase = useSharedValue(0);

  useEffect(() => {
    if (active) {
      phase.value = 0;
      phase.value = withRepeat(
        withTiming(TOTAL, {
          duration: CYCLE_DURATION,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(phase);
    }
  }, [active, phase]);

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
          alignItems: "flex-end",
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
