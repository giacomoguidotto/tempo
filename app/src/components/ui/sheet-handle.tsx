import type { BottomSheetHandleProps } from "@gorhom/bottom-sheet";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { Pressable } from "react-native";
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated";

interface SheetHandleProps extends BottomSheetHandleProps {
  onPress?: () => void;
}

function triggerDismissHaptic() {
  impactAsync(ImpactFeedbackStyle.Medium);
}

export function SheetHandle({ animatedIndex, onPress }: SheetHandleProps) {
  useAnimatedReaction(
    () => animatedIndex.value,
    (current, previous) => {
      if (current < 0 && (previous === null || previous >= 0)) {
        runOnJS(triggerDismissHaptic)();
      }
    }
  );

  const barStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedIndex.value,
      [-0.5, 0],
      ["#C06730", "#3D352E"]
    );
    return { backgroundColor };
  });

  return (
    <Pressable
      accessibilityLabel="Close"
      accessibilityRole="button"
      onPress={onPress}
      style={{ alignItems: "center", paddingVertical: 12 }}
    >
      <Animated.View
        style={[{ borderRadius: 2, height: 4, width: 40 }, barStyle]}
      />
    </Pressable>
  );
}
