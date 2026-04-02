import { Tabs } from "expo-router";
import { Clock, CalendarDays, Settings } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#C06730",
        tabBarInactiveTintColor: "#7A6F63",
        tabBarStyle: {
          borderTopColor: "#2A2420",
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
