import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { Pressable } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

interface SheetBackdropProps extends BottomSheetBackdropProps {
  onPress?: () => void;
}

export function SheetBackdrop({
  animatedIndex,
  onPress,
  style,
}: SheetBackdropProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [-1, 0, 1],
      [0, 0.4, 0.6],
      "clamp"
    ),
  }));

  return (
    <Animated.View style={[style, { backgroundColor: "#000" }, animatedStyle]}>
      {onPress ? <Pressable onPress={onPress} style={{ flex: 1 }} /> : null}
    </Animated.View>
  );
}
