import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { createRoom, validateRoom } from "../../src/api/rooms";
import { colors } from "../../src/theme/colors";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { TextField } from "../../src/components/TextField";
import { RoomIdCard } from "../../src/components/RoomIdCard";
import { getDisplayName, getRecentRooms, saveDisplayName, saveRecentRoom } from "../../src/utils/storage";

export default function HomeScreen() {
  const [joinId, setJoinId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState(null);

  const [displayName, setDisplayName] = useState("");
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [recentRooms, setRecentRooms] = useState([]);

  const joinIdNormalized = useMemo(() => String(joinId || "").trim().toUpperCase(), [joinId]);
  const quickRooms = useMemo(() => recentRooms.slice(0, 4), [recentRooms]);

  const loadLocalData = useCallback(async () => {
    const [rooms, name] = await Promise.all([getRecentRooms(), getDisplayName()]);
    setRecentRooms(rooms);
    setDisplayName(name || "");
    setDisplayNameDraft(name || "");
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLocalData();
    }, [loadLocalData])
  );

  async function onSaveDisplayName() {
    const next = String(displayNameDraft || "").trim();
    if (next && next.length < 2) {
      setError("Display name should be at least 2 characters.");
      return;
    }

    setSavingName(true);
    setError("");
    try {
      const profile = await saveDisplayName(next);
      setDisplayName(profile.displayName || "");
      setDisplayNameDraft(profile.displayName || "");
    } catch {
      setError("Could not save profile name.");
    } finally {
      setSavingName(false);
    }
  }

  async function onCreateRoom() {
    setError("");
    setBusy(true);
    try {
      const res = await createRoom();
      setCreatedRoomId(res.roomId);
      await saveRecentRoom(res.roomId);
      await loadLocalData();
    } catch (e) {
      setError(e?.message || "Failed to create room. Check backend is running.");
    } finally {
      setBusy(false);
    }
  }

  async function onJoinRoom() {
    const roomId = joinIdNormalized;
    if (!roomId) {
      setError("Enter a Room ID to join.");
      return;
    }

    setError("");
    setBusy(true);
    try {
      await validateRoom(roomId);
      await saveRecentRoom(roomId);
      await loadLocalData();
      router.push(`/chat/${roomId}`);
    } catch (e) {
      setError(e?.message || "Room not found or network error.");
    } finally {
      setBusy(false);
    }
  }

  async function onPasteRoomId() {
    try {
      const value = await Clipboard.getStringAsync();
      setJoinId(String(value || "").trim().toUpperCase());
    } catch {}
  }

  async function copyRoomId(roomId) {
    try {
      await Clipboard.setStringAsync(roomId);
      Alert.alert("Copied", "Room ID copied to clipboard.");
    } catch {
      Alert.alert("Copy failed", "Could not copy Room ID.");
    }
  }

  async function shareRoomId(roomId) {
    try {
      await Share.share({ message: `Join my room on WhatsRoom\nRoom ID: ${roomId}` });
    } catch {}
  }

  async function openRecentRoom(roomId) {
    await saveRecentRoom(roomId);
    router.push(`/chat/${roomId}`);
  }

  return (
    <LinearGradient colors={["#061120", "#0C1D33", "#091523"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="diamond-outline" size={13} color="#89FFE4" />
            <Text style={styles.heroBadgeText}>Premium Rooms</Text>
          </View>

          <Text style={styles.h1}>WhatsRoom</Text>
          <Text style={styles.h2}>Modern room chat with live sync, persistent history, and one-tap sharing.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={18} color="#99C8FF" />
            <Text style={styles.cardTitle}>Profile</Text>
          </View>
          <Text style={styles.cardSub}>Set a display name for a more personal chat experience.</Text>

          <TextField
            value={displayNameDraft}
            onChangeText={setDisplayNameDraft}
            placeholder="Display name (optional)"
            editable={!savingName}
            leftIcon="create-outline"
            maxLength={30}
          />

          <PrimaryButton
            label={savingName ? "Saving..." : displayName ? "Update Name" : "Save Name"}
            onPress={onSaveDisplayName}
            disabled={savingName}
            variant="secondary"
            leftIcon="save-outline"
            size="compact"
          />

          <Text style={styles.profileHint}>Current: {displayName || "Anonymous"}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles-outline" size={18} color="#89FFE4" />
            <Text style={styles.cardTitle}>Create Room</Text>
          </View>
          <Text style={styles.cardSub}>Spin up a fresh room instantly. No login required.</Text>

          <PrimaryButton
            label={busy ? "Creating..." : "Create Room"}
            onPress={onCreateRoom}
            disabled={busy}
            leftIcon="add-circle-outline"
            rightIcon="arrow-forward"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="log-in-outline" size={18} color="#99C8FF" />
            <Text style={styles.cardTitle}>Join Room</Text>
          </View>
          <Text style={styles.cardSub}>Paste or type an existing ROOM_ID to jump in.</Text>

          <TextField
            value={joinId}
            onChangeText={setJoinId}
            placeholder="Enter ROOM_ID (e.g. A1B2C3D4)"
            autoCapitalize="characters"
            editable={!busy}
            leftIcon="key-outline"
            rightIcon="clipboard-outline"
            onRightPress={onPasteRoomId}
            returnKeyType="go"
            onSubmitEditing={onJoinRoom}
          />

          <PrimaryButton
            label={busy ? "Joining..." : "Join Room"}
            onPress={onJoinRoom}
            disabled={busy}
            leftIcon="log-in-outline"
            rightIcon="chatbubble-ellipses-outline"
          />
        </View>

        {quickRooms.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={18} color="#A9BFFF" />
              <Text style={styles.cardTitle}>Quick Access</Text>
            </View>
            <Text style={styles.cardSub}>Jump back into your latest rooms.</Text>

            <View style={styles.quickGrid}>
              {quickRooms.map((item) => (
                <Pressable key={item.roomId} style={styles.quickChip} onPress={() => openRecentRoom(item.roomId)}>
                  <Ionicons name={item.isFavorite ? "star" : "ellipse-outline"} size={12} color="#8AFFF1" />
                  <Text style={styles.quickChipText}>{item.roomId}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={15} color="#FFB4AE" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!createdRoomId} transparent animationType="fade" onRequestClose={() => setCreatedRoomId(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCreatedRoomId(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="checkmark-done" size={20} color="#062D23" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Room created</Text>
                <Text style={styles.modalSub}>Share this code with your members.</Text>
              </View>
            </View>

            <RoomIdCard roomId={createdRoomId || ""} />

            <View style={styles.modalActions}>
              <PrimaryButton
                label="Copy"
                onPress={() => copyRoomId(createdRoomId)}
                disabled={!createdRoomId}
                variant="secondary"
                leftIcon="copy-outline"
                size="compact"
              />
              <PrimaryButton
                label="Share"
                onPress={() => shareRoomId(createdRoomId)}
                disabled={!createdRoomId}
                variant="secondary"
                leftIcon="share-social-outline"
                size="compact"
              />
              <PrimaryButton
                label="Enter Room"
                onPress={async () => {
                  const id = createdRoomId;
                  setCreatedRoomId(null);
                  if (id) {
                    await saveRecentRoom(id);
                    router.push(`/chat/${id}`);
                  }
                }}
                disabled={!createdRoomId}
                leftIcon="chatbubble-ellipses-outline"
                rightIcon="arrow-forward"
              />
            </View>

            {busy && (
              <View style={styles.modalBusy}>
                <ActivityIndicator color="#1ED760" />
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollBody: { padding: 16, paddingBottom: 26 },
  hero: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(14, 34, 58, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(186, 221, 255, 0.18)"
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "rgba(122, 255, 222, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(122, 255, 222, 0.40)",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  heroBadgeText: { color: "#BCFFE9", fontWeight: "800", fontSize: 11 },
  h1: { marginTop: 12, color: colors.text, fontSize: 28, fontWeight: "900", letterSpacing: 0.2 },
  h2: { marginTop: 6, color: colors.subtext, fontSize: 13, lineHeight: 18 },

  card: {
    marginTop: 12,
    backgroundColor: "rgba(11, 26, 45, 0.78)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(194, 218, 249, 0.18)"
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  cardSub: { marginTop: 7, color: colors.subtext, fontSize: 12, lineHeight: 16 },
  profileHint: { marginTop: 9, color: "rgba(188, 227, 255, 0.72)", fontSize: 11, fontWeight: "700" },

  quickGrid: { marginTop: 10, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(146, 246, 222, 0.32)",
    backgroundColor: "rgba(61, 213, 180, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  quickChipText: { color: "#CBFFF2", fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },

  errorBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 69, 58, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 69, 58, 0.25)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  errorText: { color: "#FFB4AE", fontSize: 12, lineHeight: 16, flex: 1 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.60)",
    justifyContent: "center",
    padding: 18
  },
  modalCard: {
    backgroundColor: "#0B1626",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(188, 220, 255, 0.18)"
  },
  modalHeader: { flexDirection: "row", gap: 10, alignItems: "center" },
  modalIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#67F4D2",
    justifyContent: "center",
    alignItems: "center"
  },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  modalSub: { marginTop: 3, color: colors.subtext, fontSize: 12 },
  modalActions: { marginTop: 12, gap: 4 },
  modalBusy: { marginTop: 10 }
});
