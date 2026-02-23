import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

function getStatusMeta(status) {
  if (status === "failed") {
    return {
      icon: "alert-circle",
      iconColor: "#FF7E7E",
      label: "Failed",
      labelColor: "#FFB4AE"
    };
  }

  if (status === "sending") {
    return {
      icon: "time-outline",
      iconColor: "rgba(7, 20, 16, 0.80)",
      label: "Sending",
      labelColor: "rgba(7, 20, 16, 0.74)"
    };
  }

  if (status === "seen") {
    return {
      icon: "checkmark-done",
      iconColor: "#0A66C2",
      label: "",
      labelColor: "transparent"
    };
  }

  if (status === "delivered") {
    return {
      icon: "checkmark-done",
      iconColor: "rgba(7, 20, 16, 0.62)",
      label: "",
      labelColor: "transparent"
    };
  }

  return {
    icon: "checkmark",
    iconColor: "rgba(7, 20, 16, 0.62)",
    label: "",
    labelColor: "transparent"
  };
}

function normalizeReactions(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry) => {
      const emoji = String(entry?.emoji || "").trim();
      if (!emoji) return null;

      const users = Array.from(
        new Set(
          (Array.isArray(entry?.users) ? entry.users : [])
            .map((x) => String(x || "").trim())
            .filter(Boolean)
        )
      );

      const count = Number.isFinite(Number(entry?.count)) ? Math.max(Number(entry.count), users.length) : users.length;
      if (count <= 0) return null;

      return { emoji, users, count };
    })
    .filter(Boolean);
}

export function MessageBubble({ mine, message, time, status, senderLabel, replyTo, reactions, senderId }) {
  const bubbleStyle = mine ? styles.mine : styles.theirs;
  const textStyle = mine ? styles.mineText : styles.theirsText;
  const meta = getStatusMeta(status);
  const reactionList = normalizeReactions(reactions);
  const hasReply = Boolean(replyTo?.message);
  const replyAuthor =
    replyTo?.senderName || (replyTo?.senderId && replyTo.senderId === senderId ? "You" : replyTo?.senderId || "User");

  return (
    <View style={[styles.row, { justifyContent: mine ? "flex-end" : "flex-start" }]}>
      <View style={[styles.bubble, bubbleStyle]}>
        {!mine && (
          <View style={styles.senderRow}>
            <Ionicons name="person-circle-outline" size={13} color="rgba(233,237,241,0.58)" />
            <Text style={styles.sender}>{senderLabel}</Text>
          </View>
        )}
        {hasReply && (
          <View style={[styles.replyBox, mine ? styles.replyBoxMine : styles.replyBoxTheirs]}>
            <Text style={[styles.replyAuthor, mine ? styles.replyAuthorMine : styles.replyAuthorTheirs]} numberOfLines={1}>
              {replyAuthor}
            </Text>
            <Text style={[styles.replyText, mine ? styles.replyTextMine : styles.replyTextTheirs]} numberOfLines={2}>
              {replyTo.message}
            </Text>
          </View>
        )}
        <Text style={[styles.msg, textStyle]}>{message}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.time, mine && styles.timeMine]}>{time}</Text>
          {mine && (
            <View style={styles.statusWrap}>
              <Ionicons name={meta.icon} size={13} color={meta.iconColor} />
              {!!meta.label && <Text style={[styles.status, { color: meta.labelColor }]}>{meta.label}</Text>}
            </View>
          )}
        </View>
        {reactionList.length > 0 && (
          <View style={styles.reactionRow}>
            {reactionList.map((entry) => {
              const reacted = entry.users.includes(String(senderId || "").trim());
              return (
                <View key={entry.emoji} style={[styles.reactionChip, reacted && styles.reactionChipActive]}>
                  <Text style={styles.reactionEmoji}>{entry.emoji}</Text>
                  <Text style={[styles.reactionCount, reacted && styles.reactionCountActive]}>{entry.count}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 10, flexDirection: "row" },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  mine: {
    backgroundColor: "#37E8BA",
    borderColor: "rgba(7, 23, 18, 0.20)",
    borderTopRightRadius: 6
  },
  theirs: {
    backgroundColor: "rgba(18, 37, 59, 0.95)",
    borderColor: "rgba(194, 216, 246, 0.20)",
    borderTopLeftRadius: 6
  },
  senderRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  sender: { color: "rgba(233,237,241,0.65)", fontSize: 11, fontWeight: "800" },
  replyBox: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  replyBoxMine: {
    backgroundColor: "rgba(5, 43, 32, 0.16)",
    borderColor: "rgba(4, 39, 29, 0.24)"
  },
  replyBoxTheirs: {
    backgroundColor: "rgba(201, 221, 249, 0.10)",
    borderColor: "rgba(188, 214, 246, 0.24)"
  },
  replyAuthor: { fontSize: 10, fontWeight: "900", marginBottom: 2 },
  replyAuthorMine: { color: "rgba(5, 51, 37, 0.82)" },
  replyAuthorTheirs: { color: "rgba(182, 216, 255, 0.90)" },
  replyText: { fontSize: 11, lineHeight: 15 },
  replyTextMine: { color: "rgba(5, 51, 37, 0.72)" },
  replyTextTheirs: { color: "rgba(214, 233, 255, 0.82)" },
  msg: { fontSize: 14, lineHeight: 19 },
  mineText: { color: "#053325", fontWeight: "700" },
  theirsText: { color: "#EAF3FF", fontWeight: "600" },
  metaRow: { marginTop: 6, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 },
  time: { color: "rgba(233,237,241,0.58)", fontSize: 11 },
  timeMine: { color: "rgba(7, 20, 16, 0.72)" },
  status: { fontSize: 10, fontWeight: "900", letterSpacing: 0.1 },
  statusWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  reactionRow: { marginTop: 7, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(186, 214, 247, 0.22)",
    backgroundColor: "rgba(160, 192, 232, 0.10)",
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  reactionChipActive: {
    borderColor: "rgba(94, 237, 195, 0.48)",
    backgroundColor: "rgba(94, 237, 195, 0.18)"
  },
  reactionEmoji: { fontSize: 12 },
  reactionCount: { fontSize: 10, color: colors.subtext, fontWeight: "800" },
  reactionCountActive: { color: "#D8FFF1" }
});
