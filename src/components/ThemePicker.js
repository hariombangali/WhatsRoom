import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CHAT_THEME_LIST } from "../utils/themes";

export function ThemePicker({ visible, currentThemeId, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Ionicons name="color-palette-outline" size={18} color="#89FFE4" />
            <Text style={styles.title}>Pick a chat vibe</Text>
          </View>
          <Text style={styles.sub}>Restyle your room with a new color palette. Saved on this device.</Text>

          <View style={styles.list}>
            {CHAT_THEME_LIST.map((theme) => {
              const active = theme.id === currentThemeId;
              return (
                <Pressable
                  key={theme.id}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => onSelect?.(theme.id)}
                >
                  <LinearGradient
                    colors={theme.backgroundGradient}
                    style={styles.swatch}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={[styles.swatchBubble, { backgroundColor: theme.theirsBubble }]} />
                    <View style={[styles.swatchBubble, styles.swatchBubbleMine, { backgroundColor: theme.mineBubble }]} />
                  </LinearGradient>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{theme.label}</Text>
                    <Text style={styles.rowHint}>{active ? "Currently active" : "Tap to apply"}</Text>
                  </View>

                  {active && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "center",
    padding: 18
  },
  card: {
    backgroundColor: "#0B1626",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(188, 220, 255, 0.18)"
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#E9EDF1", fontSize: 17, fontWeight: "900" },
  sub: { marginTop: 6, color: "rgba(233,237,241,0.66)", fontSize: 12 },
  list: { marginTop: 12, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(193, 215, 246, 0.18)",
    backgroundColor: "rgba(161, 189, 225, 0.06)"
  },
  rowActive: {
    borderColor: "rgba(92, 236, 194, 0.52)",
    backgroundColor: "rgba(92, 236, 194, 0.14)"
  },
  swatch: {
    width: 64,
    height: 42,
    borderRadius: 10,
    overflow: "hidden",
    padding: 4,
    justifyContent: "space-between"
  },
  swatchBubble: {
    width: 32,
    height: 12,
    borderRadius: 6
  },
  swatchBubbleMine: {
    alignSelf: "flex-end"
  },
  rowTitle: { color: "#E9EDF1", fontSize: 14, fontWeight: "900" },
  rowHint: { marginTop: 2, color: "rgba(233,237,241,0.62)", fontSize: 11 },
  closeBtn: {
    marginTop: 14,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(193, 215, 246, 0.28)"
  },
  closeText: { color: "#D9EBFF", fontWeight: "800", fontSize: 12 }
});
