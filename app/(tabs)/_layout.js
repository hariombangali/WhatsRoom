import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { colors } from "../../src/theme/colors";
import { fontFamilies } from "../../src/theme/typography";
import { BouncyIcon } from "../../src/components/BouncyIcon";

function TabIcon({ name, color, focused }) {
  return (
    <View style={styles.iconWrap}>
      <BouncyIcon name={name} size={22} color={color} triggerKey={focused ? "on" : "off"} />
      <View style={[styles.dot, focused && styles.dotActive]} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#161226" },
        headerShadowVisible: false,
        headerTitleStyle: {
          color: colors.text,
          fontFamily: fontFamilies.display,
          letterSpacing: 0.3
        },
        headerTintColor: colors.text,
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: "rgba(20, 16, 40, 0.98)",
          borderTopColor: "rgba(217, 183, 255, 0.22)"
        },
        tabBarLabelStyle: {
          fontFamily: fontFamilies.displaySemibold,
          fontSize: 11,
          letterSpacing: 0.3
        },
        tabBarActiveTintColor: "#FFD984",
        tabBarInactiveTintColor: "rgba(241, 236, 255, 0.55)"
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => <TabIcon name="sparkles" color={color} focused={focused} />
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Rooms",
          tabBarIcon: ({ color, focused }) => <TabIcon name="albums" color={color} focused={focused} />
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center", width: 30 },
  dot: {
    marginTop: 3,
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: "transparent"
  },
  dotActive: {
    backgroundColor: "#FFD984"
  }
});
