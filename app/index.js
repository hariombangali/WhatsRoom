import { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";
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
    <LinearGradient colors={["#050F1E", "#0B1E35", "#07152A"]} style={styles.container}>
      <Animated.View style={[styles.bgBlob, styles.bgBlobA, blobAStyle]} />
      <Animated.View style={[styles.bgBlob, styles.bgBlobB, blobBStyle]} />

      <View style={styles.center}>
        <Animated.View style={[styles.orbitRing, ringStyle]} />

        <Animated.View style={[styles.logoShell, shellStyle]}>
          <Image source={require("../assets/brand/logo-mark.png")} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>

        <Animated.View style={titleStyle}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Rooms that feel alive.</Text>
        </Animated.View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, barStyle]} />
        </View>
      </View>

      <Text style={styles.footer}>Realtime chat | custom reactions | read receipts</Text>
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
    backgroundColor: "rgba(111, 244, 255, 0.22)"
  },
  bgBlobB: {
    width: width * 0.66,
    height: width * 0.66,
    right: -width * 0.16,
    bottom: height * 0.04,
    backgroundColor: "rgba(116, 245, 198, 0.20)"
  },
  orbitRing: {
    position: "absolute",
    width: 208,
    height: 208,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(118, 255, 220, 0.33)",
    borderStyle: "dashed"
  },
  logoShell: {
    width: 154,
    height: 154,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 28, 48, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(172, 210, 255, 0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9
  },
  logoImage: {
    width: 130,
    height: 130
  },
  title: {
    marginTop: 18,
    color: "#ECF6FF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.4,
    textAlign: "center"
  },
  subtitle: {
    marginTop: 6,
    color: "rgba(224, 239, 255, 0.72)",
    fontSize: 14,
    textAlign: "center"
  },
  progressTrack: {
    marginTop: 24,
    width: "86%",
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(170, 204, 248, 0.16)"
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#58F2C8"
  },
  footer: {
    textAlign: "center",
    paddingBottom: 22,
    color: "rgba(223, 237, 255, 0.50)",
    fontSize: 11,
    letterSpacing: 0.2
  }
});
