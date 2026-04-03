import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const BAR_HEIGHTS = [28, 44, 62, 80, 100, 112, 100, 80, 62, 44, 28];
const BAR_OPACITIES = [0.3, 0.4, 0.5, 0.65, 0.8, 1, 0.8, 0.65, 0.5, 0.4, 0.3];

function AnimatedBar({
  height,
  opacity,
  index,
}: {
  height: number;
  opacity: number;
  index: number;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 80;
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
  }, [index, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height * scale.value,
    opacity,
  }));

  return (
    <Animated.View className="w-1 rounded-sm bg-accent" style={animatedStyle} />
  );
}

export function VuMeter() {
  return (
    <View className="h-[120px] flex-row items-end justify-center gap-[3px] pb-2">
      {BAR_HEIGHTS.map((height, i) => (
        <AnimatedBar
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
