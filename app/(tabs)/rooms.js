import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { radii } from "../../src/theme/radii";
import { typography, fontFamilies } from "../../src/theme/typography";
import { shadow } from "../../src/theme/shadow";
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
import { getStickerStyle } from "../../src/components/StickerChip";
import { formatRelativeTime } from "../../src/utils/time";
import { playClearTone, playDeleteTone, primeActionTone, unloadActionTone } from "../../src/utils/sound";
import { getRoomMessages } from "../../src/api/rooms";
import { useSenderId } from "../../src/hooks/useSenderId";

export default function RoomsScreen() {
  const { senderId, ready: senderReady } = useSenderId();
  const [rooms, setRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [unreadByRoom, setUnreadByRoom] = useState({});
  const syncTokenRef = useRef(0);

  const fetchUnreadCountForRoom = useCallback(
    async (roomId) => {
      if (!senderReady || !senderId) return 0;

      try {
        const res = await getRoomMessages(roomId);
        const list = Array.isArray(res?.messages) ? res.messages : [];

        return list.reduce((count, msg) => {
          const from = String(msg?.senderId || "").trim();
          if (!from || from === senderId) return count;

          const seenBy = Array.isArray(msg?.seenBy)
            ? msg.seenBy
                .map((x) => String(x || "").trim())
                .filter(Boolean)
            : [];

          if (seenBy.includes(senderId)) return count;
          return count + 1;
        }, 0);
      } catch {
        return 0;
      }
    },
    [senderId, senderReady]
  );

  const syncUnreadCounts = useCallback(
    async (recentRooms) => {
      const list = Array.isArray(recentRooms) ? recentRooms : [];
      if (!senderReady || !senderId || list.length === 0) {
        setUnreadByRoom({});
        return;
      }

      syncTokenRef.current += 1;
      const token = syncTokenRef.current;

      const pairs = await Promise.all(
        list.map(async (item) => {
          const roomId = String(item?.roomId || "").trim().toUpperCase();
          if (!roomId) return null;
          const count = await fetchUnreadCountForRoom(roomId);
          return [roomId, count];
        })
      );

      if (token !== syncTokenRef.current) return;

      const next = {};
      for (const pair of pairs) {
        if (!pair) continue;
        const [roomId, count] = pair;
        if (count > 0) next[roomId] = count;
      }
      setUnreadByRoom(next);
    },
    [fetchUnreadCountForRoom, senderId, senderReady]
  );

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

  useFocusEffect(
    useCallback(() => {
      if (!rooms.length || !senderReady || !senderId) return () => {};

      syncUnreadCounts(rooms).catch(() => {});
      const timer = setInterval(() => {
        syncUnreadCounts(rooms).catch(() => {});
      }, 15000);

      return () => {
        clearInterval(timer);
      };
    }, [rooms, senderId, senderReady, syncUnreadCounts])
  );

  useEffect(() => {
    primeActionTone().catch(() => {});
    return () => {
      unloadActionTone().catch(() => {});
    };
  }, []);

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
    setUnreadByRoom((prev) => {
      if (!prev[roomId]) return prev;
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
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
          try {
            await removeRecentRoom(roomId);
            await load();
            setUnreadByRoom((prev) => {
              if (!prev[roomId]) return prev;
              const next = { ...prev };
              delete next[roomId];
              return next;
            });
            playDeleteTone().catch(() => {});
          } catch {
            Alert.alert("Remove failed", "Could not remove room.");
          }
        }
      }
    ]);
  }

  return (
    <LinearGradient colors={["#161226", "#1F2230", "#14122B"]} style={styles.container}>
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
                ? "Create or join a room from Home — your sticker pile shows up here."
                : "Try a different room ID or clear search."
            }
            icon={rooms.length === 0 ? "albums-outline" : "search-outline"}
            mascotMood={rooms.length === 0 ? "sleepy" : undefined}
          />
        ) : (
          <View style={styles.list}>
            {filteredRooms.map((item) => {
              const sticker = getStickerStyle(item.roomId);
              return (
                <Pressable
                  key={item.roomId}
                  style={[
                    styles.roomRow,
                    { borderColor: sticker.palette.border, backgroundColor: "rgba(15, 18, 36, 0.86)" }
                  ]}
                  onPress={() => openRoom(item.roomId)}
                >
                  {!!unreadByRoom[item.roomId] && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {unreadByRoom[item.roomId] > 99 ? "99+" : unreadByRoom[item.roomId]}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.stickerAvatar, { backgroundColor: sticker.palette.bg, borderColor: sticker.palette.border }]}>
                    <Text style={styles.stickerAvatarEmoji}>{item.isFavorite ? "⭐" : sticker.emoji}</Text>
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
              );
            })}
          </View>
        )}

        <View style={{ height: 14 }} />

        <PrimaryButton
          label="Clear all recent rooms"
          variant="secondary"
          leftIcon="archive-outline"
          onPress={async () => {
            try {
              await clearRecentRooms();
              await load();
              setUnreadByRoom({});
              playClearTone().catch(() => {});
            } catch {
              Alert.alert("Clear failed", "Could not clear recent rooms.");
            }
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
    borderRadius: radii.xl,
    padding: 18,
    backgroundColor: "rgba(20, 16, 40, 0.80)",
    borderWidth: 1,
    borderColor: "rgba(217, 183, 255, 0.22)",
    ...shadow.soft
  },
  headerBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 217, 132, 0.40)",
    backgroundColor: "rgba(255, 217, 132, 0.14)",
    paddingHorizontal: 11,
    paddingVertical: 5
  },
  headerBadgeText: { color: "#FFE8B3", fontSize: 11, fontFamily: fontFamilies.displaySemibold, letterSpacing: 0.3 },
  title: { ...typography.display, marginTop: 12, color: "#FFF2DC" },
  sub: { marginTop: 6, color: colors.subtext, fontSize: 12, lineHeight: 17 },

  list: { marginTop: 14, gap: 12 },
  roomRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    ...shadow.soft
  },
  unreadBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FF5F7A",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.36)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    zIndex: 5,
    shadowColor: "#FF5F7A",
    shadowOpacity: 0.42,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: fontFamilies.display,
    letterSpacing: 0.2
  },
  stickerAvatar: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5
  },
  stickerAvatarEmoji: { fontSize: 20 },
  roomId: { color: colors.text, fontFamily: fontFamilies.display, fontSize: 15, letterSpacing: 1 },
  roomHint: { marginTop: 2, color: colors.subtext, fontSize: 11 },
  actions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    height: 32,
    width: 32,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: "rgba(189, 212, 240, 0.24)",
    backgroundColor: "rgba(171, 199, 236, 0.10)",
    alignItems: "center",
    justifyContent: "center"
  }
});
