import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
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

// How many "steps" per second the phase advances
const SPEED = TOTAL / 12; // full cycle in 12 seconds

const COLOR_IDLE = "rgba(192, 103, 48, 0.15)";
const COLOR_DIM = "#3D2E22";
const COLOR_BRIGHT = "#C06730";
const TRANSITION_MS = 1500;

function toScreenX(index: number, phaseVal: number): number {
  "worklet";
  const totalW = TOTAL * STEP;
  const rawX = index * STEP - phaseVal * STEP;
  const wrappedX = ((rawX % totalW) + totalW) % totalW;
  return wrappedX - ((TOTAL - VISIBLE) / 2) * STEP;
}

function AnimatedBar({
  index,
  position,
  progress,
}: {
  index: number;
  position: SharedValue<number>;
  progress: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const x = toScreenX(index, position.value);

    const isVisible = x >= -STEP && x <= VISIBLE_W + STEP;
    if (!isVisible) {
      return {
        height: 0,
        opacity: 0,
        backgroundColor: COLOR_IDLE,
        transform: [{ translateX: 0 }],
      };
    }

    const barCenter = x + BAR_W / 2;
    const dist = Math.min(Math.abs(barCenter - CENTER) / CENTER, 1);
    const factor = (Math.cos(dist * Math.PI) + 1) / 2;

    const scale = IDLE_SCALE + (1 - IDLE_SCALE) * progress.value;
    const height = (MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * factor) * scale;
    const activeOpacity = 0.25 + 0.75 * factor;
    const opacity = progress.value * activeOpacity + (1 - progress.value) * 0.5;

    const activeColor = interpolateColor(
      factor,
      [0, 1],
      [COLOR_DIM, COLOR_BRIGHT]
    );
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [COLOR_IDLE, activeColor]
    );

    return {
      height,
      opacity,
      backgroundColor: color,
      transform: [{ translateX: x - index * STEP }],
    };
  });

  return (
    <Animated.View
      className="absolute rounded-sm"
      style={[{ bottom: 0, left: index * STEP, width: BAR_W }, animatedStyle]}
    />
  );
}

export function VuMeter({
  active = true,
  moving = true,
}: {
  active?: boolean;
  moving?: boolean;
}) {
  // Position accumulates on the UI thread — no JS/UI sync issues
  const position = useSharedValue(0);
  const velocity = useSharedValue(moving ? 1 : 0);
  const progress = useSharedValue(active ? 1 : 0);

  // Frame callback: advance position by velocity each frame
  useFrameCallback((info) => {
    "worklet";
    if (info.timeSincePreviousFrame === null) {
      return;
    }
    const dt = info.timeSincePreviousFrame / 1000; // seconds
    position.value = (position.value + SPEED * velocity.value * dt) % TOTAL;
  });

  // Smoothly ramp velocity for start/stop
  useEffect(() => {
    velocity.value = withTiming(moving ? 1 : 0, { duration: TRANSITION_MS });
  }, [moving, velocity]);

  // Height/color/opacity
  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: TRANSITION_MS });
  }, [active, progress]);

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
            index={i}
            // biome-ignore lint/suspicious/noArrayIndexKey: static bar list
            key={i}
            position={position}
            progress={progress}
          />
        ))}
      </View>
    </View>
  );
}
