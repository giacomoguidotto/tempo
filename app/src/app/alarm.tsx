import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function AlarmScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="font-display text-4xl text-foreground">Beat</Text>
      <Pressable
        className="mt-8 rounded-full bg-accent px-8 py-4"
        onPress={() => router.back()}
      >
        <Text className="font-mono text-background text-sm uppercase tracking-widest">
          Dismiss
        </Text>
      </Pressable>
    </View>
  );
}
