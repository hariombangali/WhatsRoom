import { useEffect, useMemo } from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const PARTICLE_COUNT = 32;
const DEFAULT_PALETTE = ["#FF5F8A", "#FFCC4D", "#5CECC2", "#6FA8FF", "#C58CFF", "#FF8E5C"];

function pickShape() {
  const r = Math.random();
  if (r < 0.7) return "strip";
  if (r < 0.9) return "dot";
  return "star";
}

function ConfettiPiece({ index, total, duration, palette }) {
  const progress = useSharedValue(0);

  const config = useMemo(() => {
    const distance = SCREEN_H * (0.55 + Math.random() * 0.45);
    const drift = (Math.random() - 0.5) * SCREEN_W * 0.55;
    const size = 6 + Math.random() * 7;
    const rotateStart = Math.random() * 360;
    const rotateEnd = rotateStart + (Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 480);
    const color = palette[Math.floor(Math.random() * palette.length)];
    const delay = (index / total) * 120;
    const shape = pickShape();
    return { distance, drift, size, rotateStart, rotateEnd, color, delay, shape };
  }, [index, total, palette]);

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

  if (config.shape === "star") {
    return (
      <Animated.View pointerEvents="none" style={[styles.piece, { width: config.size * 1.6, height: config.size * 1.6 }, style]}>
        <Text style={{ fontSize: config.size * 1.4, color: config.color, lineHeight: config.size * 1.6 }}>★</Text>
      </Animated.View>
    );
  }

  if (config.shape === "dot") {
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.piece,
          {
            width: config.size,
            height: config.size,
            backgroundColor: config.color,
            borderRadius: 999
          },
          style
        ]}
      />
    );
  }

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

export function ConfettiBurst({ visible, duration = 1800, palette, onDone }) {
  useEffect(() => {
    if (!visible || !onDone) return undefined;
    const totalDelay = ((PARTICLE_COUNT - 1) / PARTICLE_COUNT) * 120 + duration + 60;
    const timer = setTimeout(() => onDone(), totalDelay);
    return () => clearTimeout(timer);
  }, [visible, duration, onDone]);

  const activePalette = useMemo(() => {
    const candidates = Array.isArray(palette) ? palette.filter(Boolean) : [];
    if (candidates.length >= 3) return candidates;
    return DEFAULT_PALETTE;
  }, [palette]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      <View style={styles.origin}>
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <ConfettiPiece
            key={i}
            index={i}
            total={PARTICLE_COUNT}
            duration={duration}
            palette={activePalette}
          />
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
