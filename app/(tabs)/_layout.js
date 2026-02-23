import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme/colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#08121F" },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text, fontWeight: "900", letterSpacing: 0.2 },
        headerTintColor: colors.text,
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: "rgba(8, 17, 30, 0.98)",
          borderTopColor: "rgba(192, 214, 243, 0.16)"
        },
        tabBarLabelStyle: {
          fontWeight: "800",
          fontSize: 11
        },
        tabBarActiveTintColor: "#37E8B7",
        tabBarInactiveTintColor: "rgba(233,237,241,0.55)"
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Rooms",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />
        }}
      />
    </Tabs>
  );
}
