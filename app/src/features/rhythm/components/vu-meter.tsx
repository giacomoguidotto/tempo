import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const BAR_HEIGHTS = [28, 44, 62, 80, 100, 112, 100, 80, 62, 44, 28];
const BAR_OPACITIES = [0.3, 0.4, 0.5, 0.65, 0.8, 1, 0.8, 0.65, 0.5, 0.4, 0.3];
const IDLE_SCALE = 0.3;

function AnimatedBar({
  active,
  height,
  index,
  opacity,
}: {
  active: boolean;
  height: number;
  index: number;
  opacity: number;
}) {
  const scale = useSharedValue(active ? 1 : IDLE_SCALE);

  useEffect(() => {
    if (active) {
      const center = (BAR_HEIGHTS.length - 1) / 2;
      const distFromCenter = Math.abs(index - center);
      const delay = distFromCenter * 100;
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.6, { duration: 800 }),
            withTiming(1, { duration: 800 })
          ),
          -1,
          true
        )
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(IDLE_SCALE, { duration: 600 });
    }
  }, [active, index, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height * scale.value,
    opacity: active ? opacity : opacity * 0.4,
  }));

  return (
    <Animated.View className="w-1 rounded-sm bg-accent" style={animatedStyle} />
  );
}

export function VuMeter({ active = true }: { active?: boolean }) {
  return (
    <View className="h-[120px] flex-row items-end justify-center gap-[3px] pb-2">
      {BAR_HEIGHTS.map((height, i) => (
        <AnimatedBar
          active={active}
          height={height}
          index={i}
          // biome-ignore lint/suspicious/noArrayIndexKey: static bar list
          key={i}
          opacity={BAR_OPACITIES[i]}
        />
      ))}
    </View>
  );
}
