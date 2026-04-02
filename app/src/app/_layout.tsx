import "../global.css";

import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_800ExtraBold,
} from "@expo-google-fonts/fraunces";
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from "@expo-google-fonts/ibm-plex-mono";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { runMigrations } from "@/lib/migrate";

preventAutoHideAsync();
runMigrations();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_800ExtraBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="rhythm/create"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="rhythm/[id]" options={{ presentation: "modal" }} />
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
