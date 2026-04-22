import { Tabs } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChartIcon } from "@/components/ui/bar-chart-icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { SlidersIcon } from "@/components/ui/sliders-icon";
import { TempoLogoIcon } from "@/components/ui/tempo-logo-icon";

// biome-ignore lint/suspicious/noExplicitAny: tab bar button props don't align with PressableProps
const TabButton = (props: any) => <PressableScale {...props} />;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [beats, setBeats] = useState({ index: 0, history: 0, settings: 0 });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#C06730",
        tabBarInactiveTintColor: "#4A433C",
        tabBarLabelStyle: {
          fontFamily: "IBMPlexMono_500Medium",
          fontSize: 9,
          letterSpacing: 1,
          textTransform: "uppercase",
        },
        tabBarButton: TabButton,
        tabBarStyle: {
          backgroundColor: "#1A1714",
          borderTopColor: "#2A2420",
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 64 + Math.max(insets.bottom, 8),
        },
      }}
    >
      <Tabs.Screen
        listeners={{
          tabPress: () => setBeats((p) => ({ ...p, index: p.index + 1 })),
        }}
        name="index"
        options={{
          title: "Rhythms",
          tabBarIcon: ({ color, size }) => (
            <TempoLogoIcon beat={beats.index} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        listeners={{
          tabPress: () => setBeats((p) => ({ ...p, history: p.history + 1 })),
        }}
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <BarChartIcon beat={beats.history} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        listeners={{
          tabPress: () => setBeats((p) => ({ ...p, settings: p.settings + 1 })),
        }}
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <SlidersIcon beat={beats.settings} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
