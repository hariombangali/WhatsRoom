import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "primary", // primary | secondary
  leftIcon,
  rightIcon,
  size = "default" // default | compact
}) {
  const isSecondary = variant === "secondary";
  const isCompact = size === "compact";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isSecondary ? styles.secondary : styles.primary,
        isCompact ? styles.compact : styles.defaultSize,
        disabled && { opacity: 0.45 },
        pressed && !disabled && styles.pressed
      ]}
    >
      <View style={styles.row}>
        {!!leftIcon && (
          <Ionicons
            name={leftIcon}
            size={17}
            color={isSecondary ? colors.text : "#05231A"}
            style={styles.leftIcon}
          />
        )}
        <Text style={[styles.text, isSecondary ? styles.textSecondary : styles.textPrimary]}>
          {label}
        </Text>
        {!!rightIcon && (
          <Ionicons
            name={rightIcon}
            size={17}
            color={isSecondary ? colors.text : "#05231A"}
            style={styles.rightIcon}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1
  },
  defaultSize: { minHeight: 48 },
  compact: { minHeight: 38, marginTop: 8 },
  primary: {
    backgroundColor: colors.accentStrong,
    borderColor: "rgba(18, 240, 180, 0.35)"
  },
  secondary: {
    backgroundColor: "rgba(143, 189, 255, 0.10)",
    borderColor: "rgba(143, 189, 255, 0.24)"
  },
  row: { flexDirection: "row", alignItems: "center" },
  text: { fontSize: 14, fontWeight: "900", letterSpacing: 0.2 },
  textPrimary: { color: "#032C1F" },
  textSecondary: { color: colors.text },
  leftIcon: { marginRight: 8 },
  rightIcon: { marginLeft: 8 },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.95 }
});
