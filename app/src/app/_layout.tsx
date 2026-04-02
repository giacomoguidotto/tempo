import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="rhythm/create"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="rhythm/[id]"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="alarm"
          options={{
            presentation: "fullScreenModal",
            gestureEnabled: false,
          }}
        />
      </Stack>
    </>
  );
}
