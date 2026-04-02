import { View } from "react-native";

const BAR_HEIGHTS = [28, 44, 62, 80, 100, 112, 100, 80, 62, 44, 28];
const BAR_OPACITIES = [0.3, 0.4, 0.5, 0.65, 0.8, 1, 0.8, 0.65, 0.5, 0.4, 0.3];

export function VuMeter() {
  return (
    <View className="h-[120px] flex-row items-end justify-center gap-[3px] pb-2">
      {BAR_HEIGHTS.map((height, i) => (
        <View
          className="w-1 rounded-sm bg-accent"
          // biome-ignore lint/suspicious/noArrayIndexKey: static bar list
          key={i}
          style={{ height, opacity: BAR_OPACITIES[i] }}
        />
      ))}
    </View>
  );
}
