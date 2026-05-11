import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { alarmScheduler } from "@/features/beat";

export default function AlarmScreen() {
  async function handleDismiss() {
    await alarmScheduler.cancelAll();
    router.back();
  }

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text
        className="text-4xl text-foreground"
        style={{ fontFamily: "Fraunces_800ExtraBold" }}
      >
        Beat
      </Text>
      <Text
        className="mt-2 text-secondary text-sm"
        style={{ fontFamily: "IBMPlexMono_400Regular" }}
      >
        Time to check in
      </Text>
      <Pressable
        accessibilityLabel="Dismiss alarm"
        accessibilityRole="button"
        className="mt-10 rounded-full bg-accent px-10 py-5"
        onPress={handleDismiss}
      >
        <Text
          className="text-foreground text-sm uppercase tracking-[2px]"
          style={{ fontFamily: "IBMPlexMono_500Medium" }}
        >
          Dismiss
        </Text>
      </Pressable>
    </View>
  );
}
