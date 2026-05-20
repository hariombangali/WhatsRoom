import { View, Text, StyleSheet } from "react-native";
import { radii } from "../theme/radii";
import { fontFamilies } from "../theme/typography";
import { BouncyIcon } from "./BouncyIcon";

export function OnlinePill({ count, status }) {
  const online = status === "online";
  const safeCount = Number(count || 0);
  const label = online ? `${safeCount} online` : "connecting";

  return (
    <View style={[styles.pill, online ? styles.online : styles.offline]}>
      <BouncyIcon
        name={online ? "radio" : "cloud-offline-outline"}
        size={12}
        color={online ? "#6EFFE0" : "#D8DEE8"}
        triggerKey={`${status}-${safeCount}`}
      />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1
  },
  online: {
    backgroundColor: "rgba(27, 227, 175, 0.15)",
    borderColor: "rgba(68, 255, 204, 0.40)"
  },
  offline: {
    backgroundColor: "rgba(145, 166, 189, 0.16)",
    borderColor: "rgba(165, 179, 194, 0.28)"
  },
  text: { color: "#E9EDF1", fontFamily: fontFamilies.displaySemibold, fontSize: 12 }
});
