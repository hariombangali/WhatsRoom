import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { createRoom, validateRoom } from "../../src/api/rooms";
import { colors } from "../../src/theme/colors";
import { radii } from "../../src/theme/radii";
import { typography, fontFamilies } from "../../src/theme/typography";
import { shadow } from "../../src/theme/shadow";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { TextField } from "../../src/components/TextField";
import { RoomIdCard } from "../../src/components/RoomIdCard";
import { ConfettiBurst } from "../../src/components/ConfettiBurst";
import { Mascot } from "../../src/components/Mascot";
import { ShineBackground } from "../../src/components/ShineBackground";
import { StickerChip } from "../../src/components/StickerChip";
import { getDisplayName, getRecentRooms, saveDisplayName, saveRecentRoom } from "../../src/utils/storage";
import { generateNickname } from "../../src/utils/nicknames";

const HERO_TAGLINES = [
  "Rooms that feel alive.",
  "Friends, but make it a room.",
  "Pop in. Stay a while.",
  "Where chat goes squishy.",
  "Your tiny clubhouse, instantly.",
  "Real-time and a little playful."
];

export default function HomeScreen() {
  const [joinId, setJoinId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState(null);

  const [displayName, setDisplayName] = useState("");
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [recentRooms, setRecentRooms] = useState([]);
  const [confettiOn, setConfettiOn] = useState(false);

  function triggerConfetti() {
    setConfettiOn(false);
    requestAnimationFrame(() => setConfettiOn(true));
  }

  function onSurpriseName() {
    setDisplayNameDraft(generateNickname());
  }

  const joinIdNormalized = useMemo(() => String(joinId || "").trim().toUpperCase(), [joinId]);
  const quickRooms = useMemo(() => recentRooms.slice(0, 5), [recentRooms]);
  const heroTagline = useMemo(() => HERO_TAGLINES[Math.floor(Math.random() * HERO_TAGLINES.length)], []);

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
      triggerConfetti();
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
    <LinearGradient colors={["#161226", "#1F2230", "#14122B"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ShineBackground />
          <View style={styles.heroContent}>
            <View style={styles.heroTextCol}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles-outline" size={13} color="#FFD984" />
                <Text style={styles.heroBadgeText}>Hello, friend!</Text>
              </View>

              <Text style={styles.h1}>WhatsRoom</Text>
              <Text style={styles.h2}>{heroTagline}</Text>
            </View>
            <View style={styles.heroMascot}>
              <Mascot size={68} mood="happy" />
            </View>
          </View>
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

          <View style={styles.profileButtonRow}>
            <View style={styles.profileButtonItem}>
              <PrimaryButton
                label={savingName ? "Saving..." : displayName ? "Update Name" : "Save Name"}
                onPress={onSaveDisplayName}
                disabled={savingName}
                variant="secondary"
                leftIcon="save-outline"
                size="compact"
              />
            </View>
            <View style={styles.profileButtonItem}>
              <PrimaryButton
                label="Surprise me"
                onPress={onSurpriseName}
                disabled={savingName}
                variant="secondary"
                leftIcon="sparkles-outline"
                size="compact"
              />
            </View>
          </View>

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
            tone="mint"
          />
          <View style={styles.buttonMetaRow}>
            <View style={[styles.buttonMetaChip, styles.buttonMetaMint]}>
              <Ionicons name="flash-outline" size={12} color="#8AFFE5" />
              <Text style={styles.buttonMetaText}>Instant ID</Text>
            </View>
            <View style={[styles.buttonMetaChip, styles.buttonMetaMint]}>
              <Ionicons name="shield-checkmark-outline" size={12} color="#8AFFE5" />
              <Text style={styles.buttonMetaText}>No signup</Text>
            </View>
          </View>
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
            tone="azure"
          />
          <View style={styles.buttonMetaRow}>
            <View style={[styles.buttonMetaChip, styles.buttonMetaAzure]}>
              <Ionicons name="sync-outline" size={12} color="#A7CEFF" />
              <Text style={styles.buttonMetaText}>Real-time sync</Text>
            </View>
            <View style={[styles.buttonMetaChip, styles.buttonMetaAzure]}>
              <Ionicons name="albums-outline" size={12} color="#A7CEFF" />
              <Text style={styles.buttonMetaText}>Shared history</Text>
            </View>
          </View>
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
                <StickerChip
                  key={item.roomId}
                  roomId={item.roomId}
                  isFavorite={item.isFavorite}
                  onPress={() => openRecentRoom(item.roomId)}
                  compact
                />
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

      <ConfettiBurst visible={confettiOn} onDone={() => setConfettiOn(false)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollBody: { padding: 16, paddingBottom: 26 },
  hero: {
    borderRadius: radii.xl,
    padding: 20,
    backgroundColor: "rgba(20, 16, 40, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255, 217, 132, 0.20)",
    overflow: "hidden",
    ...shadow.pop
  },
  heroContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroTextCol: { flex: 1 },
  heroMascot: { width: 76, alignItems: "center", justifyContent: "center" },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 217, 132, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 217, 132, 0.45)",
    paddingHorizontal: 11,
    paddingVertical: 5
  },
  heroBadgeText: { color: "#FFE8B3", fontFamily: fontFamilies.displaySemibold, fontSize: 11, letterSpacing: 0.3 },
  h1: { ...typography.displayXL, marginTop: 12, color: "#FFF2DC", fontSize: 30 },
  h2: { marginTop: 6, color: "rgba(255, 232, 207, 0.78)", fontSize: 13, lineHeight: 18 },

  card: {
    marginTop: 14,
    backgroundColor: "rgba(15, 18, 36, 0.80)",
    borderRadius: radii.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(217, 183, 255, 0.18)",
    ...shadow.soft
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { ...typography.h2, color: colors.text },
  cardSub: { marginTop: 7, color: colors.subtext, fontSize: 12, lineHeight: 17 },
  profileButtonRow: { marginTop: 4, flexDirection: "row", gap: 8 },
  profileButtonItem: { flex: 1 },
  profileHint: { marginTop: 10, color: "rgba(255, 217, 184, 0.78)", fontSize: 11, fontFamily: fontFamilies.displaySemibold, letterSpacing: 0.3 },
  buttonMetaRow: { marginTop: 12, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  buttonMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6
  },
  buttonMetaMint: {
    borderColor: "rgba(180, 241, 214, 0.45)",
    backgroundColor: "rgba(180, 241, 214, 0.14)"
  },
  buttonMetaAzure: {
    borderColor: "rgba(185, 219, 255, 0.45)",
    backgroundColor: "rgba(185, 219, 255, 0.14)"
  },
  buttonMetaText: { color: "#F1ECFF", fontFamily: fontFamilies.displaySemibold, fontSize: 11, letterSpacing: 0.3 },

  quickGrid: { marginTop: 12, flexDirection: "row", gap: 8, flexWrap: "wrap" },

  errorBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: "rgba(255, 105, 97, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 105, 97, 0.32)",
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
    borderRadius: radii.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(188, 220, 255, 0.18)"
  },
  modalHeader: { flexDirection: "row", gap: 10, alignItems: "center" },
  modalIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: "#67F4D2",
    justifyContent: "center",
    alignItems: "center"
  },
  modalTitle: { ...typography.h2, color: colors.text, fontSize: 18 },
  modalSub: { marginTop: 4, color: colors.subtext, fontSize: 12, lineHeight: 17 },
  modalActions: { marginTop: 12, gap: 4 },
  modalBusy: { marginTop: 10 }
});
