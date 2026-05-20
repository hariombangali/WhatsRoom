import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CHAT_THEME_LIST } from "../utils/themes";
import { radii } from "../theme/radii";
import { typography, fontFamilies } from "../theme/typography";

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
                    <View style={[styles.swatchBubble, { backgroundColor: theme.theirsBubble }]}>
                      <Text style={[styles.swatchBubbleText, { color: theme.theirsText }]}>Hi!</Text>
                    </View>
                    <View style={[styles.swatchBubble, styles.swatchBubbleMine, { backgroundColor: theme.mineBubble }]}>
                      <Text style={[styles.swatchBubbleText, { color: theme.mineText }]}>Hey!</Text>
                    </View>
                  </LinearGradient>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{theme.label}</Text>
                    <Text style={styles.rowHint}>{active ? "Currently active" : "Tap to apply"}</Text>
                  </View>

                  {active && <Ionicons name="checkmark-circle" size={22} color={theme.accent} />}
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
    borderRadius: radii.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(188, 220, 255, 0.18)"
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { ...typography.h2, color: "#E9EDF1" },
  sub: { marginTop: 6, color: "rgba(233,237,241,0.66)", fontSize: 12, lineHeight: 17 },
  list: { marginTop: 14, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(193, 215, 246, 0.18)",
    backgroundColor: "rgba(161, 189, 225, 0.06)"
  },
  rowActive: {
    borderColor: "rgba(92, 236, 194, 0.52)",
    backgroundColor: "rgba(92, 236, 194, 0.14)"
  },
  swatch: {
    width: 78,
    height: 56,
    borderRadius: radii.md,
    overflow: "hidden",
    padding: 6,
    justifyContent: "space-between"
  },
  swatchBubble: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start"
  },
  swatchBubbleMine: {
    alignSelf: "flex-end"
  },
  swatchBubbleText: { fontSize: 9, fontFamily: fontFamilies.displaySemibold, letterSpacing: 0.2 },
  rowTitle: { color: "#E9EDF1", fontSize: 14, fontFamily: fontFamilies.display, letterSpacing: 0.2 },
  rowHint: { marginTop: 2, color: "rgba(233,237,241,0.62)", fontSize: 11 },
  closeBtn: {
    marginTop: 16,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(193, 215, 246, 0.28)"
  },
  closeText: { color: "#D9EBFF", fontFamily: fontFamilies.displaySemibold, fontSize: 12, letterSpacing: 0.3 }
});
