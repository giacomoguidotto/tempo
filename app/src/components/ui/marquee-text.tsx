import { useEffect, useState } from "react";
import { type TextProps, type TextStyle, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useReduceMotion } from "@/lib/use-reduce-motion";

const PAUSE_MS = 2000;
const SPEED = 30; // pixels per second

interface MarqueeTextProps extends Omit<TextProps, "style"> {
  style?: TextStyle;
}

export function MarqueeText({
  children,
  numberOfLines = 1,
  style,
  ...rest
}: MarqueeTextProps) {
  const reduceMotion = useReduceMotion();
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useSharedValue(0);

  const overflow = textWidth - containerWidth;
  const shouldScroll = overflow > 0 && !reduceMotion;

  useEffect(() => {
    if (!shouldScroll) {
      translateX.value = 0;
      return;
    }

    const duration = (overflow / SPEED) * 1000;
    translateX.value = withDelay(
      PAUSE_MS,
      withRepeat(
        withSequence(
          withTiming(-overflow, { duration, easing: Easing.linear }),
          withDelay(PAUSE_MS, withTiming(0, { duration: 0 })),
          withDelay(PAUSE_MS, withTiming(0, { duration: 0 }))
        ),
        -1
      )
    );
  }, [shouldScroll, overflow, translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={{ overflow: "hidden" }}
    >
      <Animated.Text
        {...rest}
        numberOfLines={numberOfLines}
        onTextLayout={(e) => {
          const measured = e.nativeEvent.lines[0]?.width ?? 0;
          setTextWidth(measured);
        }}
        style={[
          style,
          animStyle,
          shouldScroll ? { width: textWidth } : undefined,
        ]}
      >
        {children}
      </Animated.Text>
    </View>
  );
}
