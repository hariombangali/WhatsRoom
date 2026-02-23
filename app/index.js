import { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { router } from "expo-router";
import { colors } from "../src/theme/colors";

const { width } = Dimensions.get("window");

export default function SplashRoute() {
  const scale = useSharedValue(1);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 600, easing: Easing.out(Easing.quad) }),
        withTiming(1.0, { duration: 600, easing: Easing.in(Easing.quad) })
      ),
      -1,
      true
    );

    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    const t = setTimeout(() => {
      router.replace("/(tabs)");
    }, 1400);

    return () => clearTimeout(t);
  }, [scale, shimmer]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: 64 + shimmer.value * (width * 0.55),
    opacity: 0.35 + shimmer.value * 0.55
  }));

  const title = useMemo(() => "WhatsRoom", []);

  return (
    <LinearGradient colors={["#061120", "#0D2340", "#091728"]} style={styles.container}>
      <View style={styles.center}>
        <Animated.View style={[styles.logo, logoStyle]}>
          <Text style={styles.logoText}>WR</Text>
        </Animated.View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Fast. Simple. Real-time rooms.</Text>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, barStyle]} />
        </View>
      </View>

      <Text style={styles.footer}>Android | No Login | Socket.IO</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  logo: {
    width: 92,
    height: 92,
    borderRadius: 22,
    backgroundColor: "rgba(17, 36, 60, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(173, 207, 252, 0.18)"
  },
  logoText: { color: "#83FFE2", fontSize: 34, fontWeight: "900", letterSpacing: 1 },
  title: { marginTop: 16, color: colors.text, fontSize: 24, fontWeight: "800" },
  subtitle: { marginTop: 6, color: colors.subtext, fontSize: 13 },
  progressTrack: {
    marginTop: 22,
    height: 10,
    width: "84%",
    borderRadius: 999,
    backgroundColor: "rgba(171, 206, 255, 0.12)",
    overflow: "hidden"
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#32E7B8"
  },
  footer: {
    textAlign: "center",
    paddingBottom: 22,
    color: "rgba(233, 237, 241, 0.45)",
    fontSize: 12
  }
});
