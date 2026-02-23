import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export function EmptyState({ title, subtitle, icon = "sparkles-outline" }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color="#7DFFDE" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "rgba(16, 33, 56, 0.62)",
    borderWidth: 1,
    borderColor: "rgba(197, 223, 255, 0.16)",
    alignItems: "center"
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(75, 226, 190, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(121, 255, 223, 0.32)",
    justifyContent: "center",
    alignItems: "center"
  },
  title: { marginTop: 10, color: colors.text, fontWeight: "900", fontSize: 14 },
  sub: { marginTop: 6, color: colors.subtext, fontSize: 12, textAlign: "center", lineHeight: 16 }
});
