import { useEffect, useMemo } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const PARTICLE_COUNT = 28;
const PALETTE = ["#FF5F8A", "#FFCC4D", "#5CECC2", "#6FA8FF", "#C58CFF", "#FF8E5C"];

function ConfettiPiece({ index, total, duration }) {
  const progress = useSharedValue(0);

  const config = useMemo(() => {
    const distance = SCREEN_H * (0.55 + Math.random() * 0.45);
    const drift = (Math.random() - 0.5) * SCREEN_W * 0.55;
    const size = 6 + Math.random() * 6;
    const rotateStart = Math.random() * 360;
    const rotateEnd = rotateStart + (Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 480);
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const delay = (index / total) * 120;
    return { distance, drift, size, rotateStart, rotateEnd, color, delay };
  }, [index, total]);

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withTiming(1, { duration, easing: Easing.out(Easing.quad) });
    }, config.delay);

    return () => clearTimeout(timer);
  }, [config.delay, duration, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const horizontal = config.drift * p;
    const vertical = config.distance * p;
    const rotate = config.rotateStart + (config.rotateEnd - config.rotateStart) * p;
    const opacity = p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15;

    return {
      transform: [{ translateX: horizontal }, { translateY: vertical }, { rotate: `${rotate}deg` }],
      opacity
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          width: config.size,
          height: config.size * 0.4,
          backgroundColor: config.color,
          borderRadius: 2
        },
        style
      ]}
    />
  );
}

export function ConfettiBurst({ visible, duration = 1800, onDone }) {
  useEffect(() => {
    if (!visible || !onDone) return undefined;
    const totalDelay = ((PARTICLE_COUNT - 1) / PARTICLE_COUNT) * 120 + duration + 60;
    const timer = setTimeout(() => onDone(), totalDelay);
    return () => clearTimeout(timer);
  }, [visible, duration, onDone]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      <View style={styles.origin}>
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <ConfettiPiece key={i} index={i} total={PARTICLE_COUNT} duration={duration} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-start",
    zIndex: 50
  },
  origin: {
    position: "absolute",
    top: SCREEN_H * 0.25,
    left: SCREEN_W / 2,
    width: 0,
    height: 0
  },
  piece: {
    position: "absolute",
    left: -3,
    top: -3
  }
});
