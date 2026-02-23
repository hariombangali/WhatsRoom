import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  ScrollView,
  Alert
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { colors } from "../../src/theme/colors";
import {
  clearRecentRooms,
  getRecentRooms,
  removeRecentRoom,
  saveRecentRoom,
  toggleRecentRoomFavorite
} from "../../src/utils/storage";
import { EmptyState } from "../../src/components/EmptyState";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { TextField } from "../../src/components/TextField";
import { formatRelativeTime } from "../../src/utils/time";

export default function RoomsScreen() {
  const [rooms, setRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const r = await getRecentRooms();
    setRooms(r);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filteredRooms = useMemo(() => {
    const q = String(query || "").trim().toUpperCase();
    if (!q) return rooms;
    return rooms.filter((x) => x.roomId.includes(q));
  }, [rooms, query]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function openRoom(roomId) {
    await saveRecentRoom(roomId);
    router.push(`/chat/${roomId}`);
  }

  async function copyRoomId(roomId) {
    try {
      await Clipboard.setStringAsync(roomId);
      Alert.alert("Copied", `${roomId} copied to clipboard.`);
    } catch {
      Alert.alert("Copy failed", "Could not copy room ID.");
    }
  }

  function askRemoveRoom(roomId) {
    Alert.alert("Remove room", `Remove ${roomId} from recent list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removeRecentRoom(roomId);
          await load();
        }
      }
    ]);
  }

  return (
    <LinearGradient colors={["#061120", "#0C1C30", "#081523"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#31D0AA" />}
      >
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Ionicons name="grid-outline" size={12} color="#8BFFE2" />
            <Text style={styles.headerBadgeText}>Room Manager</Text>
          </View>
          <Text style={styles.title}>Recent Rooms</Text>
          <Text style={styles.sub}>Search, pin favorites, copy IDs, and reopen chats quickly.</Text>
        </View>

        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Search room ID..."
          leftIcon="search-outline"
          rightIcon={query ? "close-outline" : undefined}
          onRightPress={query ? () => setQuery("") : undefined}
        />

        {filteredRooms.length === 0 ? (
          <EmptyState
            title={rooms.length === 0 ? "No rooms yet" : "No result"}
            subtitle={
              rooms.length === 0
                ? "Create or join a room from Home. Recent rooms will appear here."
                : "Try a different room ID or clear search."
            }
            icon={rooms.length === 0 ? "albums-outline" : "search-outline"}
          />
        ) : (
          <View style={styles.list}>
            {filteredRooms.map((item) => (
              <Pressable key={item.roomId} style={styles.roomRow} onPress={() => openRoom(item.roomId)}>
                <View style={[styles.badge, item.isFavorite && styles.badgeFavorite]}>
                  <Ionicons
                    name={item.isFavorite ? "star" : "key-outline"}
                    size={13}
                    color={item.isFavorite ? "#FFD88F" : "#7CFFDD"}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.roomId}>{item.roomId}</Text>
                  <Text style={styles.roomHint}>Last active {formatRelativeTime(item.lastOpenedAt)}</Text>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={async (e) => {
                      e.stopPropagation();
                      await toggleRecentRoomFavorite(item.roomId);
                      await load();
                    }}
                  >
                    <Ionicons
                      name={item.isFavorite ? "star" : "star-outline"}
                      size={16}
                      color={item.isFavorite ? "#FFD88F" : "#CCE0FF"}
                    />
                  </Pressable>

                  <Pressable
                    style={styles.actionBtn}
                    onPress={async (e) => {
                      e.stopPropagation();
                      await copyRoomId(item.roomId);
                    }}
                  >
                    <Ionicons name="copy-outline" size={16} color="#CCE0FF" />
                  </Pressable>

                  <Pressable
                    style={styles.actionBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      askRemoveRoom(item.roomId);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FFB4AE" />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 14 }} />

        <PrimaryButton
          label="Clear all recent rooms"
          variant="secondary"
          leftIcon="archive-outline"
          onPress={async () => {
            await clearRecentRooms();
            await load();
          }}
          disabled={rooms.length === 0}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16, paddingBottom: 26 },
  header: {
    borderRadius: 22,
    padding: 15,
    backgroundColor: "rgba(13, 31, 52, 0.74)",
    borderWidth: 1,
    borderColor: "rgba(188, 218, 255, 0.16)"
  },
  headerBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(124, 255, 221, 0.35)",
    backgroundColor: "rgba(124, 255, 221, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  headerBadgeText: { color: "#C6FFF0", fontSize: 11, fontWeight: "900" },
  title: { marginTop: 10, color: colors.text, fontSize: 23, fontWeight: "900" },
  sub: { marginTop: 6, color: colors.subtext, fontSize: 12, lineHeight: 16 },

  list: { marginTop: 12, gap: 10 },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(11, 26, 45, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(192, 216, 250, 0.18)"
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(30, 215, 96, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(30, 215, 96, 0.25)"
  },
  badgeFavorite: {
    backgroundColor: "rgba(255, 204, 102, 0.12)",
    borderColor: "rgba(255, 216, 143, 0.40)"
  },
  roomId: { color: colors.text, fontWeight: "900", fontSize: 14, letterSpacing: 0.5 },
  roomHint: { marginTop: 2, color: colors.subtext, fontSize: 11 },
  actions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    height: 30,
    width: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(189, 212, 240, 0.22)",
    backgroundColor: "rgba(171, 199, 236, 0.08)",
    alignItems: "center",
    justifyContent: "center"
  }
});
