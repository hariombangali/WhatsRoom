import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function OnlinePill({ count, status }) {
  const online = status === "online";
  const label = online ? `${Number(count || 0)} online` : "connecting";

  return (
    <View style={[styles.pill, online ? styles.online : styles.offline]}>
      <Ionicons name={online ? "radio" : "cloud-offline-outline"} size={12} color={online ? "#6EFFE0" : "#D8DEE8"} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1
  },
  online: {
    backgroundColor: "rgba(27, 227, 175, 0.15)",
    borderColor: "rgba(68, 255, 204, 0.35)"
  },
  offline: {
    backgroundColor: "rgba(145, 166, 189, 0.16)",
    borderColor: "rgba(165, 179, 194, 0.28)"
  },
  text: { color: "#E9EDF1", fontWeight: "800", fontSize: 12 }
});
