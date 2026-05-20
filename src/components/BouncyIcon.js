import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

export function BouncyIcon({ name, size = 18, color, active, triggerKey, style }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.25, { duration: 120, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 8, stiffness: 200, mass: 0.5 })
    );
  }, [active, triggerKey, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <AnimatedIonicons name={name} size={size} color={color} />
    </Animated.View>
  );
}
