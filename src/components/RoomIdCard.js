import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { fontFamilies } from "../theme/typography";

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
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: "rgba(18, 35, 58, 0.70)",
    borderWidth: 1,
    borderColor: "rgba(184, 218, 255, 0.22)"
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { color: colors.subtext, fontSize: 11, fontFamily: fontFamilies.displaySemibold, letterSpacing: 1.2 },
  id: { marginTop: 8, color: "#7BFFE0", fontSize: 26, fontFamily: fontFamilies.display, letterSpacing: 3 },
  hint: { marginTop: 8, color: "rgba(233,237,241,0.66)", fontSize: 12 }
});
