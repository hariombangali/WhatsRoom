import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";

const DEFAULT_TINTS = ["rgba(255, 179, 156, 0.45)", "rgba(180, 241, 214, 0.40)"];

export function ShineBackground({ tints = DEFAULT_TINTS, style }) {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [drift]);

  const blobAStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-12, 16]) },
      { translateY: interpolate(drift.value, [0, 1], [-6, 10]) }
    ],
    opacity: interpolate(drift.value, [0, 1], [0.6, 0.95])
  }));

  const blobBStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [18, -14]) },
      { translateY: interpolate(drift.value, [0, 1], [8, -8]) }
    ],
    opacity: interpolate(drift.value, [0, 1], [0.55, 0.9])
  }));

  const [tintA, tintB] = tints;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer, style]}>
      <Animated.View style={[styles.blob, styles.blobA, { backgroundColor: tintA }, blobAStyle]} />
      <Animated.View style={[styles.blob, styles.blobB, { backgroundColor: tintB }, blobBStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { overflow: "hidden", borderRadius: 28 },
  blob: {
    position: "absolute",
    borderRadius: 999
  },
  blobA: {
    width: 220,
    height: 220,
    top: -90,
    left: -60
  },
  blobB: {
    width: 200,
    height: 200,
    bottom: -80,
    right: -70
  }
});
