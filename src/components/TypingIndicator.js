import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { radii } from "../theme/radii";

const DOT_COLOR = "#8AC4FF";

function Dot({ delay }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 320, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 280 })
        ),
        -1,
        false
      )
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -4]) },
      { scale: interpolate(progress.value, [0, 1], [0.7, 1]) }
    ],
    opacity: interpolate(progress.value, [0, 1], [0.5, 1])
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function TypingIndicator({ typingSenderId }) {
  const label = String(typingSenderId || "").trim();
  if (!label) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.dotRow}>
        <Dot delay={0} />
        <Dot delay={140} />
        <Dot delay={280} />
      </View>
      <Text style={styles.text}>{label.slice(0, 20)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(180, 213, 255, 0.22)",
    backgroundColor: "rgba(126, 170, 235, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start"
  },
  dotRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: DOT_COLOR
  },
  text: {
    color: "rgba(233,237,241,0.72)",
    fontSize: 12,
    fontStyle: "italic"
  }
});
