import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const TONE_MAP = {
  mint: {
    gradient: ["#A9FFE7", "#61EFC9", "#1BC697"],
    text: "#052E24",
    icon: "#053628",
    border: "rgba(141, 252, 229, 0.44)",
    shadow: "#32D3AD",
    sheen: "rgba(255,255,255,0.23)",
    orbMain: "rgba(255,255,255,0.22)",
    orbSub: "rgba(9, 92, 73, 0.23)",
    glow: "rgba(233, 255, 246, 0.95)",
    iconBg: "rgba(255,255,255,0.34)",
    innerStroke: "rgba(255,255,255,0.19)"
  },
  azure: {
    gradient: ["#A5CCFF", "#6CAEFF", "#3D7EE0"],
    text: "#06294A",
    icon: "#093058",
    border: "rgba(164, 202, 255, 0.46)",
    shadow: "#5D9CFF",
    sheen: "rgba(255,255,255,0.24)",
    orbMain: "rgba(240, 247, 255, 0.18)",
    orbSub: "rgba(21, 63, 126, 0.23)",
    glow: "rgba(233, 244, 255, 0.98)",
    iconBg: "rgba(255,255,255,0.32)",
    innerStroke: "rgba(255,255,255,0.22)"
  }
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "primary", // primary | secondary
  tone = "mint", // mint | azure
  leftIcon,
  rightIcon,
  size = "default" // default | compact
}) {
  const isSecondary = variant === "secondary";
  const isCompact = size === "compact";
  const palette = TONE_MAP[tone] || TONE_MAP.mint;
  const iconColor = isSecondary ? "#DCEBFF" : palette.icon;
  const textColor = isSecondary ? "#EAF3FF" : palette.text;
  const iconSize = isCompact ? 15 : 16;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pressable,
        isCompact ? styles.compactPressable : styles.defaultPressable,
        disabled && { opacity: 0.45 },
        pressed && !disabled && styles.pressed
      ]}
      android_ripple={{ color: "rgba(255,255,255,0.16)", borderless: false }}
    >
      <View
        style={[
          styles.layer,
          isSecondary ? styles.secondaryLayer : styles.primaryLayer,
          isCompact ? styles.compactLayer : styles.defaultLayer,
          !isSecondary && { borderColor: palette.border, shadowColor: palette.shadow }
        ]}
      >
        <LinearGradient
          colors={isSecondary ? ["rgba(164, 196, 242, 0.16)", "rgba(133, 170, 223, 0.09)"] : palette.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.surface, isCompact && styles.compactSurface]}
        >
          <View
            style={[
              styles.sheen,
              isSecondary ? styles.sheenSecondary : styles.sheenPrimary,
              !isSecondary && { backgroundColor: palette.sheen }
            ]}
          />

          {!isSecondary && (
            <>
              <View style={[styles.orbMain, { backgroundColor: palette.orbMain }]} />
              <View style={[styles.orbSub, { backgroundColor: palette.orbSub }]} />
              <View style={[styles.innerStroke, { borderColor: palette.innerStroke }]} />
              <View style={[styles.glowDot, { backgroundColor: palette.glow }]} />
            </>
          )}

          <View style={styles.row}>
            {!!leftIcon && (
              <View style={[styles.iconWrap, !isSecondary && { backgroundColor: palette.iconBg }]}>
                <Ionicons name={leftIcon} size={iconSize} color={iconColor} />
              </View>
            )}
            <Text style={[styles.text, isCompact && styles.compactText, { color: textColor }]}>{label}</Text>
            {!!rightIcon && (
              <View style={[styles.iconWrap, !isSecondary && { backgroundColor: palette.iconBg }]}>
                <Ionicons name={rightIcon} size={iconSize} color={iconColor} />
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden"
  },
  defaultPressable: { minHeight: 50 },
  compactPressable: { minHeight: 40, marginTop: 8 },
  layer: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4
  },
  defaultLayer: { minHeight: 50 },
  compactLayer: { minHeight: 40, borderRadius: 14 },
  primaryLayer: { borderColor: "rgba(125, 248, 226, 0.30)" },
  secondaryLayer: {
    borderColor: "rgba(169, 204, 249, 0.26)",
    shadowOpacity: 0.05,
    elevation: 1
  },
  surface: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14
  },
  compactSurface: {
    paddingHorizontal: 12
  },
  sheen: {
    position: "absolute",
    top: 0,
    left: 8,
    right: 8,
    height: "45%",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18
  },
  sheenPrimary: {
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  sheenSecondary: {
    backgroundColor: "rgba(201, 223, 252, 0.10)"
  },
  orbMain: {
    position: "absolute",
    left: -18,
    top: -15,
    width: 96,
    height: 52,
    borderRadius: 999
  },
  orbSub: {
    position: "absolute",
    right: -6,
    bottom: -16,
    width: 74,
    height: 30,
    borderRadius: 999,
    transform: [{ rotate: "-7deg" }]
  },
  innerStroke: {
    position: "absolute",
    left: 6,
    right: 6,
    top: 5,
    bottom: 5,
    borderRadius: 12,
    borderWidth: 1
  },
  glowDot: {
    position: "absolute",
    right: 8,
    top: 7,
    width: 7,
    height: 7,
    borderRadius: 99
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  text: {
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: 0.35,
    textShadowColor: "rgba(255,255,255,0.20)",
    textShadowRadius: 3
  },
  compactText: {
    fontSize: 13.25,
    letterSpacing: 0.25
  },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.97 }
});
