import { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { router } from "expo-router";
import { Mascot } from "../src/components/Mascot";
import { typography, fontFamilies } from "../src/theme/typography";

const { width, height } = Dimensions.get("window");

export default function SplashRoute() {
  const reveal = useSharedValue(0);
  const pulse = useSharedValue(0);
  const spin = useSharedValue(0);
  const drift = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    reveal.value = withTiming(1, { duration: 1550, easing: Easing.out(Easing.cubic) });

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    spin.value = withRepeat(withTiming(1, { duration: 6800, easing: Easing.linear }), -1, false);

    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    shimmer.value = withRepeat(withTiming(1, { duration: 1450, easing: Easing.inOut(Easing.quad) }), -1, true);

    const t = setTimeout(() => {
      router.replace("/(tabs)");
    }, 2350);

    return () => clearTimeout(t);
  }, [reveal, pulse, spin, drift, shimmer]);

  const blobAStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 + drift.value * 14 }, { translateX: -12 + pulse.value * 10 }],
    opacity: 0.24 + pulse.value * 0.18
  }));

  const blobBStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: 8 - drift.value * 12 }, { translateX: 18 - pulse.value * 12 }],
    opacity: 0.22 + pulse.value * 0.14
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }, { scale: 0.98 + pulse.value * 0.07 }],
    opacity: 0.45 + pulse.value * 0.3
  }));

  const shellStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: interpolate(reveal.value, [0, 1], [18, 0]) }, { scale: 0.93 + pulse.value * 0.06 }]
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: interpolate(reveal.value, [0, 1], [16, 0]) }]
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: 66 + shimmer.value * (width * 0.52),
    opacity: 0.35 + shimmer.value * 0.55
  }));

  const title = useMemo(() => "WhatsRoom", []);

  return (
    <LinearGradient colors={["#0E1024", "#1F2230", "#14192E"]} style={styles.container}>
      <Animated.View style={[styles.bgBlob, styles.bgBlobA, blobAStyle]} />
      <Animated.View style={[styles.bgBlob, styles.bgBlobB, blobBStyle]} />

      <View style={styles.center}>
        <Animated.View style={[styles.orbitRing, ringStyle]} />

        <Animated.View style={[styles.logoShell, shellStyle]}>
          <Mascot size={120} mood="excited" />
        </Animated.View>

        <Animated.View style={titleStyle}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Rooms that feel alive.</Text>
        </Animated.View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, barStyle]} />
        </View>
      </View>

      <Text style={styles.footer}>Realtime chat | playful reactions | read receipts</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 26
  },
  bgBlob: {
    position: "absolute",
    borderRadius: 999
  },
  bgBlobA: {
    width: width * 0.72,
    height: width * 0.72,
    left: -width * 0.26,
    top: -width * 0.24,
    backgroundColor: "rgba(255, 179, 156, 0.28)"
  },
  bgBlobB: {
    width: width * 0.66,
    height: width * 0.66,
    right: -width * 0.16,
    bottom: height * 0.04,
    backgroundColor: "rgba(180, 241, 214, 0.24)"
  },
  orbitRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255, 217, 132, 0.42)",
    borderStyle: "dashed"
  },
  logoShell: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(35, 28, 56, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(217, 183, 255, 0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9
  },
  title: {
    ...typography.displayXL,
    marginTop: 22,
    color: "#FFF2DC",
    textAlign: "center",
    fontFamily: fontFamilies.display
  },
  subtitle: {
    marginTop: 6,
    color: "rgba(255, 236, 211, 0.78)",
    fontSize: 14,
    textAlign: "center"
  },
  progressTrack: {
    marginTop: 26,
    width: "86%",
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255, 217, 132, 0.16)"
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#FFD984"
  },
  footer: {
    textAlign: "center",
    paddingBottom: 22,
    color: "rgba(255, 236, 211, 0.55)",
    fontSize: 11,
    letterSpacing: 0.2
  }
});
