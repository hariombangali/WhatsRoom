import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Keep native splash until first screen renders.
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 300);

    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0B141A" },
          headerTitleStyle: { color: "#E9EDF1", fontWeight: "700" },
          headerTintColor: "#E9EDF1",
          contentStyle: { backgroundColor: "#0B141A" }
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="chat/[roomId]"
          options={{
            title: "Chat",
            headerBackTitleVisible: false
          }}
        />
      </Stack>
    </>
  );
}
