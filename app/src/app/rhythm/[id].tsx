import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function EditRhythmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="font-display text-2xl text-foreground">Edit Rhythm</Text>
      <Text className="font-mono text-muted text-sm">{id}</Text>
    </View>
  );
}
