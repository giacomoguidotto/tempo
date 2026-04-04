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
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { createNotificationChannels } from "@/features/beat/channels";
import {
  handleInitialNotification,
  registerNotificationHandlers,
} from "@/features/beat/handler";
import { runMigrations } from "@/lib/migrate";

preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_800ExtraBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    runMigrations();
    createNotificationChannels();
    registerNotificationHandlers();
    handleInitialNotification();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="rhythm/[id]"
            options={{
              presentation: "modal",
              gestureEnabled: true,
              animation: "slide_from_bottom",
              gestureDirection: "vertical",
            }}
          />
          <Stack.Screen
            name="alarm"
            options={{
              presentation: "fullScreenModal",
              gestureEnabled: false,
            }}
          />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
