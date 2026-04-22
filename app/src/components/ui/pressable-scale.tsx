import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_DURATION = 120;
const RELEASE_DURATION = 200;
const EASING = Easing.inOut(Easing.ease);

interface PressableScaleProps extends Omit<PressableProps, "style"> {
  /** Pressed scale — lower = more visible. Default 0.96. */
  scale?: number;
  style?: StyleProp<ViewStyle>;
}

export function PressableScale({
  onPressIn,
  onPressOut,
  disabled,
  scale: scaleDown = 0.96,
  style,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) {
          scale.value = withTiming(scaleDown, {
            duration: PRESS_DURATION,
            easing: EASING,
          });
          impactAsync(ImpactFeedbackStyle.Light);
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, {
          duration: RELEASE_DURATION,
          easing: EASING,
        });
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
