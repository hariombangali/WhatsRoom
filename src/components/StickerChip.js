import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radii } from "../theme/radii";
import { fontFamilies } from "../theme/typography";

const STICKER_PALETTE = [
  { bg: "#FFD4C2", border: "#FFB39C", text: "#5A2616" },
  { bg: "#C9F3DC", border: "#7ED7B0", text: "#0F4630" },
  { bg: "#E2CFFF", border: "#BFA0FF", text: "#3A1B6A" },
  { bg: "#CDE5FF", border: "#88BAFF", text: "#143869" },
  { bg: "#FFE7B0", border: "#FFD984", text: "#5A3A05" },
  { bg: "#FFC9D7", border: "#FF8FAE", text: "#5B0F2E" }
];

const ROOM_EMOJIS = ["🌈", "🚀", "🪐", "🍩", "🦄", "🐳", "🌸", "🎈", "⭐", "🍉"];

function hashRoomId(roomId) {
  const id = String(roomId || "").toUpperCase();
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getStickerStyle(roomId) {
  const idx = hashRoomId(roomId);
  return {
    palette: STICKER_PALETTE[idx % STICKER_PALETTE.length],
    emoji: ROOM_EMOJIS[idx % ROOM_EMOJIS.length]
  };
}

export function StickerChip({
  roomId,
  isFavorite,
  showEmoji = true,
  onPress,
  trailing,
  compact = false
}) {
  const { palette, emoji } = getStickerStyle(roomId);
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[
        styles.chip,
        compact && styles.chipCompact,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border
        }
      ]}
    >
      {showEmoji && (
        <Text style={[styles.emoji, compact && styles.emojiCompact]}>{isFavorite ? "⭐" : emoji}</Text>
      )}
      <Text
        style={[styles.label, compact && styles.labelCompact, { color: palette.text }]}
        numberOfLines={1}
      >
        {String(roomId).toUpperCase()}
      </Text>
      {isFavorite && !showEmoji && (
        <Ionicons name="star" size={compact ? 11 : 13} color={palette.text} />
      )}
      {trailing}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  chipCompact: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 6
  },
  emoji: { fontSize: 16 },
  emojiCompact: { fontSize: 13 },
  label: { fontSize: 13, fontFamily: fontFamilies.display, letterSpacing: 0.4 },
  labelCompact: { fontSize: 12 }
});
