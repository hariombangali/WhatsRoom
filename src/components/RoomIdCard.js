import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export function RoomIdCard({ roomId }) {
  return (
    <View style={styles.box}>
      <View style={styles.topRow}>
        <Ionicons name="key-outline" size={14} color="rgba(186, 221, 255, 0.78)" />
        <Text style={styles.label}>ROOM ID</Text>
      </View>
      <Text style={styles.id}>{roomId}</Text>
      <Text style={styles.hint}>Share this code with your team to join the same live room.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(18, 35, 58, 0.70)",
    borderWidth: 1,
    borderColor: "rgba(184, 218, 255, 0.20)"
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { color: colors.subtext, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  id: { marginTop: 7, color: "#7BFFE0", fontSize: 22, fontWeight: "900", letterSpacing: 2 },
  hint: { marginTop: 8, color: "rgba(233,237,241,0.66)", fontSize: 12 }
});
