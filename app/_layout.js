import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts, Quicksand_600SemiBold, Quicksand_700Bold } from "@expo-google-fonts/quicksand";
import { initNotifications } from "../src/utils/notifications";
import { fontFamilies } from "../src/theme/typography";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [fontFamilies.display]: Quicksand_700Bold,
    [fontFamilies.displaySemibold]: Quicksand_600SemiBold
  });

  useEffect(() => {
    initNotifications().catch(() => {});
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;

    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 200);

    return () => clearTimeout(t);
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0B141A" },
          headerTitleStyle: { color: "#E9EDF1", fontFamily: fontFamilies.display },
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
