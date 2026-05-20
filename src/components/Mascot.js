import { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
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
import { LinearGradient } from "expo-linear-gradient";

const MOOD_PALETTE = {
  happy: ["#FFD1B8", "#FFB39C"],
  excited: ["#B4F1D6", "#7ED7B0"],
  sleepy: ["#D9B7FF", "#B595FF"],
  wink: ["#B9DBFF", "#88BAFF"]
};

function Eye({ size, blink, wink }) {
  const animatedStyle = useAnimatedStyle(() => {
    const scaleY = wink ? 0.08 : interpolate(blink.value, [0, 0.5, 1], [1, 0.1, 1]);
    return {
      transform: [{ scaleY }]
    };
  });

  return (
    <Animated.View
      style={[
        styles.eye,
        { width: size, height: size * 1.1, borderRadius: size },
        animatedStyle
      ]}
    />
  );
}

function Mouth({ mood, size }) {
  if (mood === "sleepy") {
    return (
      <View style={[styles.mouthSleepy, { width: size * 0.55, height: size * 0.18 }]} />
    );
  }

  if (mood === "excited") {
    return (
      <View style={[styles.mouthExcited, { width: size * 0.6, height: size * 0.45 }]}>
        <View style={[styles.mouthExcitedInner, { width: size * 0.5, height: size * 0.32 }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.mouthHappy,
        {
          width: size * 0.55,
          height: size * 0.28,
          borderBottomLeftRadius: size,
          borderBottomRightRadius: size
        }
      ]}
    />
  );
}

export function Mascot({ size = 100, mood = "happy", style }) {
  const blink = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(
        withDelay(2200, withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) })),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );

    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [blink, bob]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(bob.value, [0, 1], [-2, 2]) }]
  }));

  const palette = useMemo(() => MOOD_PALETTE[mood] || MOOD_PALETTE.happy, [mood]);
  const eyeSize = size * 0.13;
  const cheekSize = size * 0.18;
  const isWinkRight = mood === "wink";

  return (
    <Animated.View
      style={[
        { width: size, height: size, alignItems: "center", justifyContent: "center" },
        style,
        bodyStyle
      ]}
    >
      <LinearGradient
        colors={palette}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 0.85, y: 1 }}
        style={[
          styles.body,
          {
            width: size,
            height: size * 0.92,
            borderRadius: size * 0.46
          }
        ]}
      />

      <View
        style={[
          styles.highlight,
          {
            width: size * 0.32,
            height: size * 0.16,
            borderRadius: size,
            top: size * 0.12,
            left: size * 0.18
          }
        ]}
      />

      <View style={[styles.faceWrap, { width: size, height: size }]}>
        <View
          style={[
            styles.eyesRow,
            { gap: size * 0.18, marginTop: size * 0.36 }
          ]}
        >
          <Eye size={eyeSize} blink={blink} wink={false} />
          <Eye size={eyeSize} blink={blink} wink={isWinkRight} />
        </View>

        <View style={{ height: size * 0.04 }} />

        <Mouth mood={mood} size={size} />

        <View style={[styles.cheeksRow, { width: size }]}>
          <View
            style={[
              styles.cheek,
              {
                width: cheekSize,
                height: cheekSize * 0.6,
                borderRadius: cheekSize,
                left: size * 0.08
              }
            ]}
          />
          <View
            style={[
              styles.cheek,
              {
                width: cheekSize,
                height: cheekSize * 0.6,
                borderRadius: cheekSize,
                right: size * 0.08
              }
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: {
    position: "absolute",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  highlight: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    opacity: 0.7
  },
  faceWrap: {
    position: "absolute",
    alignItems: "center"
  },
  eyesRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  eye: {
    backgroundColor: "#1B1830"
  },
  mouthHappy: {
    backgroundColor: "#1B1830",
    borderTopWidth: 0
  },
  mouthSleepy: {
    backgroundColor: "#1B1830",
    borderRadius: 99
  },
  mouthExcited: {
    backgroundColor: "#1B1830",
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden"
  },
  mouthExcitedInner: {
    backgroundColor: "#FF6F8B",
    borderRadius: 99
  },
  cheeksRow: {
    position: "absolute",
    top: "60%",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  cheek: {
    position: "absolute",
    backgroundColor: "rgba(255, 130, 150, 0.55)"
  }
});
