import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function TypingIndicator({ typingSenderId }) {
  const label = String(typingSenderId || "").trim();
  if (!label) return null;

  return (
    <View style={styles.wrap}>
      <Ionicons name="ellipsis-horizontal-circle-outline" size={14} color="rgba(233,237,241,0.60)" />
      <Text style={styles.text}>{label.slice(0, 20)} is typing...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(180, 213, 255, 0.20)",
    backgroundColor: "rgba(126, 170, 235, 0.10)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start"
  },
  text: {
    color: "rgba(233,237,241,0.60)",
    fontSize: 12,
    fontStyle: "italic"
  }
});
