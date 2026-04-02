import { Tabs } from "expo-router";
import { CalendarDays, Clock, Settings } from "lucide-react-native";

export default function TabLayout() {
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
        tabBarStyle: {
          backgroundColor: "#1A1714",
          borderTopColor: "#2A2420",
          borderTopWidth: 1,
          paddingTop: 8,
          height: 64,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Rhythms",
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
