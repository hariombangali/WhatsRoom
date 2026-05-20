import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { typography } from "../theme/typography";
import { Mascot } from "./Mascot";

export function EmptyState({ title, subtitle, icon = "sparkles-outline", mascotMood }) {
  return (
    <View style={styles.wrap}>
      {mascotMood ? (
        <Mascot size={84} mood={mascotMood} />
      ) : (
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={22} color="#7DFFDE" />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    padding: 20,
    borderRadius: radii.xl,
    backgroundColor: "rgba(16, 33, 56, 0.62)",
    borderWidth: 1,
    borderColor: "rgba(197, 223, 255, 0.16)",
    alignItems: "center"
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: "rgba(75, 226, 190, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(121, 255, 223, 0.32)",
    justifyContent: "center",
    alignItems: "center"
  },
  title: { ...typography.h2, marginTop: 12, color: colors.text },
  sub: { marginTop: 6, color: colors.subtext, fontSize: 12, textAlign: "center", lineHeight: 17 }
});
