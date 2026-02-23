import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  TextInput,
  Platform,
  Pressable,
  AppState,
  Alert,
  Share
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../src/theme/colors";
import { MessageBubble } from "../../src/components/MessageBubble";
import { TypingIndicator } from "../../src/components/TypingIndicator";
import { OnlinePill } from "../../src/components/OnlinePill";
import { getRoomMessages, validateRoom } from "../../src/api/rooms";
import { useSenderId } from "../../src/hooks/useSenderId";
import { useSocket } from "../../src/hooks/useSocket";
import { formatTime } from "../../src/utils/time";
import { getDisplayName, saveRecentRoom } from "../../src/utils/storage";
import { playSendTone, primeSendTone, unloadSendTone } from "../../src/utils/sound";

const MESSAGE_MAX_LENGTH = 2000;
const COMPOSER_SAFE_HEIGHT = 136;
const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥"];

function normalizeSeenBy(raw) {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(
      raw
        .map((x) => String(x || "").trim())
        .filter(Boolean)
    )
  );
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

function getMessageKey(item, index) {
  const id = String(item?._id || "").trim();
  if (id) return id;

  const clientId = String(item?.clientMessageId || "").trim();
  if (clientId) return `local-${clientId}`;

  return `${item?.senderId || "message"}-${item?.timestamp || index}-${index}`;
}

function buildReplyPreview(item) {
  const id = String(item?._id || "").trim();
  if (!id || id.startsWith("local-")) return null;

  const message = String(item?.message || "").trim();
  return {
    messageId: id,
    senderId: item?.senderId ? String(item.senderId) : null,
    senderName: item?.senderName ? String(item.senderName) : null,
    message: message.slice(0, 180)
  };
}

function toggleLocalReactionState(current, emoji, senderId) {
  const normalized = normalizeReactions(current);
  const me = String(senderId || "").trim();
  if (!me) return normalized;

  const next = normalized.map((entry) => ({ ...entry, users: [...entry.users] }));
  const index = next.findIndex((x) => x.emoji === emoji);

  if (index === -1) {
    next.push({ emoji, users: [me], count: 1 });
    return next;
  }

  const users = next[index].users.filter((u) => u !== me);
  if (users.length === next[index].users.length) {
    users.push(me);
  }

  if (users.length === 0) {
    next.splice(index, 1);
  } else {
    next[index] = { ...next[index], users, count: users.length };
  }

  return next;
}

export default function ChatScreen() {
  const { roomId: roomIdParam } = useLocalSearchParams();
  const roomId = String(roomIdParam || "").trim().toUpperCase();

  const { senderId, ready: senderReady } = useSenderId();
  const { socket, status, connectAndJoin, leaveRoom, sendMessage, setTyping, markSeen, toggleReaction } =
    useSocket();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const [usersCount, setUsersCount] = useState(0);
  const [typingSender, setTypingSender] = useState(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [androidKeyboardOffset, setAndroidKeyboardOffset] = useState(0);
  const [chatLayoutHeight, setChatLayoutHeight] = useState(0);
  const [activeMessageKey, setActiveMessageKey] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  const listRef = useRef(null);
  const typingTimerRef = useRef(null);
  const nearBottomRef = useRef(true);
  const seenInFlightRef = useRef(false);
  const baseLayoutHeightRef = useRef(0);

  const canSend = useMemo(() => {
    const text = String(input || "").trim();
    return !!text && text.length <= MESSAGE_MAX_LENGTH && !isSending && status !== "offline";
  }, [input, isSending, status]);

  const keyboardVerticalOffset = useMemo(() => (Platform.OS === "ios" ? headerHeight + 2 : 0), [headerHeight]);
  const composerPaddingBottom = useMemo(
    () => COMPOSER_SAFE_HEIGHT + (replyTo ? 42 : 0) + Math.max(insets.bottom, 6),
    [replyTo, insets.bottom]
  );

  const headerRight = useMemo(() => <OnlinePill count={usersCount} status={status} />, [usersCount, status]);

  const hasUnreadFromOthers = useMemo(
    () =>
      messages.some((m) => {
        if (!m || !m.senderId || m.senderId === senderId) return false;
        return !normalizeSeenBy(m.seenBy).includes(senderId);
      }),
    [messages, senderId]
  );

  const markRoomSeen = useCallback(async () => {
    if (!roomId || !senderReady || !senderId || status !== "online") return;
    if (!hasUnreadFromOthers || seenInFlightRef.current) return;

    seenInFlightRef.current = true;
    try {
      await markSeen();
    } catch {
      // no-op: receipts are best effort
    } finally {
      seenInFlightRef.current = false;
    }
  }, [roomId, senderReady, senderId, status, hasUnreadFromOthers, markSeen]);

  const getOutgoingStatus = useCallback(
    (item) => {
      if (!item) return "sent";
      if (item.localStatus === "sending" || item.localStatus === "failed") return item.localStatus;

      const seenBy = normalizeSeenBy(item.seenBy);
      const seenByOthers = seenBy.some((id) => id !== senderId);
      if (seenByOthers) return "seen";
      if (usersCount > 1) return "delivered";
      return "sent";
    },
    [senderId, usersCount]
  );

  useEffect(() => {
    if (!roomId) return;
    saveRecentRoom(roomId).catch(() => {});
  }, [roomId]);

  useEffect(() => {
    primeSendTone().catch(() => {});
    return () => {
      unloadSendTone().catch(() => {});
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      setLoading(true);
      setLoadError("");

      try {
        if (!roomId) throw new Error("Invalid room id");

        await validateRoom(roomId);

        const currentDisplayName = await getDisplayName().catch(() => "");
        if (mounted) {
          setDisplayName(currentDisplayName || "");
        }

        const res = await getRoomMessages(roomId);
        if (!mounted) return;
        const serverMessages = Array.isArray(res?.messages) ? res.messages : [];
        setMessages(
          serverMessages.map((m) => ({
            ...m,
            replyTo: m?.replyTo?.messageId ? m.replyTo : null,
            seenBy: normalizeSeenBy(m.seenBy),
            reactions: normalizeReactions(m.reactions),
            seenAt: m.seenAt || null,
            localStatus: "sent"
          }))
        );

        if (senderReady) {
          await connectAndJoin({ roomId, senderId, displayName: currentDisplayName || null });
        }
      } catch (e) {
        if (!mounted) return;
        setLoadError(e?.message || "Failed to load room.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    boot();

    return () => {
      mounted = false;
    };
  }, [roomId, senderReady, senderId, connectAndJoin]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active" && senderReady && roomId) {
        try {
          await connectAndJoin({ roomId, senderId, displayName: displayName || null });
          await markRoomSeen();
        } catch {}
      }
    });

    return () => sub.remove();
  }, [senderReady, senderId, roomId, connectAndJoin, displayName, markRoomSeen]);

  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      if (!msg || String(msg.roomId).toUpperCase() !== roomId) return;

      setMessages((prev) => {
        if (msg._id && prev.some((m) => m._id === msg._id)) return prev;

        if (msg.clientMessageId) {
          const idx = prev.findIndex((m) => m.clientMessageId === msg.clientMessageId);
          if (idx !== -1) {
            const copy = prev.slice();
            copy[idx] = {
              ...copy[idx],
              ...msg,
              replyTo: msg?.replyTo?.messageId ? msg.replyTo : null,
              seenBy: normalizeSeenBy(msg.seenBy),
              reactions: normalizeReactions(msg.reactions),
              seenAt: msg.seenAt || null,
              localStatus: "sent"
            };
            return copy;
          }
        }

        return [
          ...prev,
          {
            ...msg,
            replyTo: msg?.replyTo?.messageId ? msg.replyTo : null,
            seenBy: normalizeSeenBy(msg.seenBy),
            reactions: normalizeReactions(msg.reactions),
            seenAt: msg.seenAt || null,
            localStatus: "sent"
          }
        ];
      });

      setTypingSender(null);
    };

    const onTyping = ({ roomId: eventRoomId, senderId: sId, senderName, isTyping } = {}) => {
      if (eventRoomId && String(eventRoomId).toUpperCase() !== roomId) return;
      if (!sId || sId === senderId) return;
      setTypingSender(isTyping ? String(senderName || sId).trim() : null);
    };

    const onUsers = ({ roomId: eventRoomId, usersCount: c } = {}) => {
      if (eventRoomId && String(eventRoomId).toUpperCase() !== roomId) return;
      const count = Number(c);
      setUsersCount(Number.isFinite(count) ? count : 0);
    };

    const onMessagesSeen = ({ roomId: eventRoomId, messages: seenMessages } = {}) => {
      if (eventRoomId && String(eventRoomId).toUpperCase() !== roomId) return;
      if (!Array.isArray(seenMessages) || seenMessages.length === 0) return;

      const updates = new Map(
        seenMessages
          .map((m) => {
            const id = String(m?._id || "").trim();
            if (!id) return null;
            return [
              id,
              {
                seenBy: normalizeSeenBy(m.seenBy),
                seenAt: m.seenAt || null
              }
            ];
          })
          .filter(Boolean)
      );

      if (!updates.size) return;

      setMessages((prev) =>
        prev.map((item) => {
          const key = String(item?._id || "").trim();
          if (!key || !updates.has(key)) return item;
          return {
            ...item,
            ...updates.get(key)
          };
        })
      );
    };

    const onReactionUpdated = ({ roomId: eventRoomId, messageId, reactions } = {}) => {
      if (eventRoomId && String(eventRoomId).toUpperCase() !== roomId) return;
      const key = String(messageId || "").trim();
      if (!key) return;

      const normalized = normalizeReactions(reactions);
      setMessages((prev) =>
        prev.map((item) => (String(item?._id || "").trim() === key ? { ...item, reactions: normalized } : item))
      );
    };

    socket.on("receive-message", onReceive);
    socket.on("typing", onTyping);
    socket.on("online-users", onUsers);
    socket.on("messages-seen", onMessagesSeen);
    socket.on("message-reaction-updated", onReactionUpdated);

    return () => {
      socket.off("receive-message", onReceive);
      socket.off("typing", onTyping);
      socket.off("online-users", onUsers);
      socket.off("messages-seen", onMessagesSeen);
      socket.off("message-reaction-updated", onReactionUpdated);
    };
  }, [socket, roomId, senderId]);

  useEffect(() => {
    return () => {
      leaveRoom().catch(() => {});
    };
  }, [leaveRoom]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setTyping(false);
    };
  }, [setTyping]);

  useEffect(() => {
    if (!nearBottomRef.current) return;

    const t = setTimeout(() => {
      try {
        listRef.current?.scrollToEnd({ animated: true });
      } catch {}
    }, 80);

    return () => clearTimeout(t);
  }, [messages.length]);

  useEffect(() => {
    if (!nearBottomRef.current) return;
    const t = setTimeout(() => {
      markRoomSeen().catch(() => {});
    }, 140);
    return () => clearTimeout(t);
  }, [messages.length, markRoomSeen]);

  useEffect(() => {
    if (status !== "online") return;
    markRoomSeen().catch(() => {});
  }, [status, markRoomSeen]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onShow = (event) => {
      const rawHeight = Number(event?.endCoordinates?.height || 0);
      const keyboardHeight = Math.max(rawHeight - Math.max(insets.bottom, 0), 0);

      const baseline = baseLayoutHeightRef.current || chatLayoutHeight;
      const shrink = baseline && chatLayoutHeight ? Math.max(baseline - chatLayoutHeight, 0) : 0;
      const nextOffset = Math.max(0, keyboardHeight - shrink);
      setAndroidKeyboardOffset(nextOffset);
    };

    const onHide = () => {
      setAndroidKeyboardOffset(0);
    };

    const showSub = Keyboard.addListener("keyboardDidShow", onShow);
    const hideSub = Keyboard.addListener("keyboardDidHide", onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [chatLayoutHeight, insets.bottom]);

  function handleInputChange(text) {
    setInput(text);
    setTyping(true);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setTyping(false);
    }, 900);
  }

  function onListScroll(e) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distance = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    const nearBottom = distance < 110;
    nearBottomRef.current = nearBottom;
    setShowJumpToLatest(!nearBottom && messages.length > 10);
    if (activeMessageKey) setActiveMessageKey(null);
    if (nearBottom) {
      markRoomSeen().catch(() => {});
    }
  }

  async function copyMessage(message) {
    try {
      await Clipboard.setStringAsync(String(message || ""));
      Alert.alert("Copied", "Message copied.");
    } catch {}
  }

  async function copyRoomId() {
    try {
      await Clipboard.setStringAsync(roomId);
      Alert.alert("Copied", "Room ID copied.");
    } catch {}
  }

  async function shareRoomId() {
    try {
      await Share.share({
        message: `Join my room on WhatsRoom\nRoom ID: ${roomId}`
      });
    } catch {}
  }

  async function onToggleReaction(item, emoji) {
    const messageId = String(item?._id || "").trim();
    if (!messageId || messageId.startsWith("local-")) return;

    setMessages((prev) =>
      prev.map((m) =>
        String(m?._id || "").trim() === messageId
          ? { ...m, reactions: toggleLocalReactionState(m.reactions, emoji, senderId) }
          : m
      )
    );

    try {
      const ack = await toggleReaction({ messageId, emoji });
      if (Array.isArray(ack?.reactions)) {
        const normalized = normalizeReactions(ack.reactions);
        setMessages((prev) =>
          prev.map((m) => (String(m?._id || "").trim() === messageId ? { ...m, reactions: normalized } : m))
        );
      }
    } catch {}
  }

  async function onSend() {
    const text = input.trim();
    if (!text || !senderReady) return;

    setIsSending(true);

    const clientMessageId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const optimistic = {
      _id: `local-${clientMessageId}`,
      roomId,
      message: text,
      senderId,
      senderName: displayName || null,
      replyTo: replyTo?.messageId ? replyTo : null,
      timestamp: new Date().toISOString(),
      clientMessageId,
      seenBy: [senderId],
      seenAt: null,
      reactions: [],
      localStatus: "sending"
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setReplyTo(null);
    setActiveMessageKey(null);
    setTyping(false);
    nearBottomRef.current = true;

    try {
      await sendMessage({ message: text, clientMessageId, replyToMessageId: replyTo?.messageId || null });
      playSendTone().catch(() => {});
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === clientMessageId ? { ...m, localStatus: "failed" } : m
        )
      );
    } finally {
      setIsSending(false);
    }
  }

  async function retryFailed(m) {
    if (!m || m.localStatus !== "failed") return;
    setMessages((prev) =>
      prev.map((x) => (x.clientMessageId === m.clientMessageId ? { ...x, localStatus: "sending" } : x))
    );

    try {
      await sendMessage({ message: m.message, clientMessageId: m.clientMessageId });
    } catch {
      setMessages((prev) =>
        prev.map((x) => (x.clientMessageId === m.clientMessageId ? { ...x, localStatus: "failed" } : x))
      );
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        pointerEvents="none"
        colors={["#07101D", "#0A172A", "#08101D"]}
        style={StyleSheet.absoluteFillObject}
      />

      <Stack.Screen
        options={{
          title: `Room ${roomId}`,
          headerRight: () => headerRight
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingTitle}>Loading room...</Text>
          <Text style={styles.loadingSub}>Fetching messages and connecting.</Text>
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={styles.errTitle}>Cannot open this room</Text>
          <Text style={styles.errSub}>{loadError}</Text>

          <View style={{ height: 12 }} />
          <Pressable style={styles.retryBtn} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.retryText}>Back to Home</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.chatBody}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
          enabled={Platform.OS === "ios"}
          onLayout={(event) => {
            const h = Number(event?.nativeEvent?.layout?.height || 0);
            setChatLayoutHeight(h);
            if (Platform.OS === "android" && androidKeyboardOffset === 0 && h > 0) {
              baseLayoutHeightRef.current = h;
            }
          }}
        >
          <View style={styles.topMeta}>
            <View style={styles.topRow}>
              <View style={styles.roomBadge}>
                <Ionicons name="key-outline" size={13} color="#8BFFE4" />
                <Text style={styles.roomBadgeText}>{roomId}</Text>
              </View>

              <View style={styles.profileBadge}>
                <Ionicons name="person-circle-outline" size={13} color="#C7DDFF" />
                <Text style={styles.profileBadgeText}>{displayName || "Anonymous"}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={styles.metaAction} onPress={copyRoomId}>
                <Ionicons name="copy-outline" size={13} color="#D2E3FF" />
                <Text style={styles.metaActionText}>Copy room</Text>
              </Pressable>

              <Pressable style={styles.metaAction} onPress={shareRoomId}>
                <Ionicons name="share-social-outline" size={13} color="#D2E3FF" />
                <Text style={styles.metaActionText}>Share invite</Text>
              </Pressable>
            </View>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, index) => getMessageKey(item, index)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.listContent, { paddingBottom: composerPaddingBottom }]}
            onScroll={onListScroll}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => {
              const mine = item.senderId === senderId;
              const time = formatTime(item.timestamp);
              const messageKey = getMessageKey(item, index);

              return (
                <Animated.View entering={FadeInDown.duration(180)} layout={Layout.springify()}>
                  <View>
                    <Pressable
                      onPress={() => {
                        if (item.localStatus === "failed") {
                          retryFailed(item);
                          return;
                        }

                        setActiveMessageKey((prev) => (prev === messageKey ? null : messageKey));
                      }}
                      onLongPress={() => setActiveMessageKey(messageKey)}
                    >
                      <MessageBubble
                        mine={mine}
                        message={item.message}
                        time={time}
                        status={mine ? getOutgoingStatus(item) : "sent"}
                        senderLabel={mine ? "You" : String(item.senderName || item.senderId || "").slice(0, 20)}
                        replyTo={item.replyTo}
                        reactions={item.reactions}
                        senderId={senderId}
                      />
                    </Pressable>

                    {activeMessageKey === messageKey && (
                      <View style={[styles.msgActionBar, mine ? styles.msgActionBarMine : styles.msgActionBarTheirs]}>
                        {QUICK_REACTIONS.map((emoji) => {
                          const reacted = normalizeReactions(item.reactions).some(
                            (entry) => entry.emoji === emoji && entry.users.includes(senderId)
                          );

                          return (
                            <Pressable
                              key={`${messageKey}-${emoji}`}
                              onPress={() => onToggleReaction(item, emoji)}
                              style={[styles.reactionQuickBtn, reacted && styles.reactionQuickBtnActive]}
                            >
                              <Text style={styles.reactionQuickText}>{emoji}</Text>
                            </Pressable>
                          );
                        })}

                        <Pressable
                          onPress={() => {
                            const nextReply = buildReplyPreview(item);
                            if (nextReply) setReplyTo(nextReply);
                            setActiveMessageKey(null);
                          }}
                          style={styles.msgIconBtn}
                        >
                          <Ionicons name="return-up-back-outline" size={14} color="#D9EBFF" />
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            copyMessage(item.message);
                            setActiveMessageKey(null);
                          }}
                          style={styles.msgIconBtn}
                        >
                          <Ionicons name="copy-outline" size={14} color="#D9EBFF" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            }}
          />

          {showJumpToLatest && (
            <Pressable
              style={[styles.jumpBtn, Platform.OS === "android" && { bottom: 138 + androidKeyboardOffset }]}
              onPress={() => {
                nearBottomRef.current = true;
                setShowJumpToLatest(false);
                listRef.current?.scrollToEnd({ animated: true });
              }}
            >
              <Ionicons name="arrow-down" size={14} color="#042B1E" />
              <Text style={styles.jumpBtnText}>Latest</Text>
            </Pressable>
          )}

          <View style={[styles.composerShell, Platform.OS === "android" && { marginBottom: androidKeyboardOffset }]}>
            <TypingIndicator typingSenderId={typingSender} />
            <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              {!!replyTo && (
                <View style={styles.replyComposerBox}>
                  <View style={styles.replyComposerStripe} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.replyComposerTitle} numberOfLines={1}>
                      Replying to {replyTo.senderName || (replyTo.senderId === senderId ? "You" : "User")}
                    </Text>
                    <Text style={styles.replyComposerText} numberOfLines={1}>
                      {replyTo.message}
                    </Text>
                  </View>
                  <Pressable onPress={() => setReplyTo(null)} style={styles.replyComposerClose}>
                    <Ionicons name="close" size={14} color="#D3E7FF" />
                  </Pressable>
                </View>
              )}

              <View style={styles.composerMainRow}>
                <View style={styles.inputCapsule}>
                  <View style={styles.inputIconWrap}>
                    <Ionicons name="chatbox-ellipses-outline" size={16} color="rgba(210, 229, 255, 0.72)" />
                  </View>
                  <TextInput
                    value={input}
                    onChangeText={handleInputChange}
                    placeholder={status === "offline" ? "Offline..." : "Type your message"}
                    placeholderTextColor="rgba(210, 229, 255, 0.45)"
                    editable={status !== "offline"}
                    multiline
                    textAlignVertical="top"
                    keyboardAppearance="dark"
                    selectionColor="#63F2CD"
                    maxLength={MESSAGE_MAX_LENGTH}
                    style={styles.inputText}
                  />
                </View>

                <Pressable
                  onPress={onSend}
                  disabled={!canSend}
                  style={[styles.sendBtn, { opacity: canSend ? 1 : 0.35 }]}
                >
                  <Ionicons name="paper-plane" size={17} color="#052B20" />
                </Pressable>
              </View>

              <View style={styles.composerMetaRow}>
                <Text style={styles.countText}>
                  {input.length}/{MESSAGE_MAX_LENGTH}
                </Text>
                <Text style={styles.footerText}>
                  {status === "offline"
                    ? "Reconnecting..."
                    : isSending
                    ? "Sending..."
                    : "Hold message to copy"}
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  chatBody: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  loadingTitle: { color: colors.text, fontWeight: "900", fontSize: 16 },
  loadingSub: { marginTop: 6, color: colors.subtext, fontSize: 12, textAlign: "center" },

  errTitle: { color: colors.text, fontWeight: "900", fontSize: 16 },
  errSub: { marginTop: 6, color: colors.subtext, fontSize: 12, textAlign: "center", lineHeight: 16 },

  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#1ED760"
  },
  retryText: { color: "#0B141A", fontWeight: "900" },

  topMeta: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(186, 216, 255, 0.20)",
    backgroundColor: "rgba(14, 31, 52, 0.70)"
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  roomBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(137, 255, 228, 0.36)",
    backgroundColor: "rgba(68, 245, 207, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  roomBadgeText: { color: "#B8FFF1", fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },
  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(198, 217, 245, 0.30)",
    backgroundColor: "rgba(172, 196, 228, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  profileBadgeText: { color: "#D2E4FF", fontSize: 11, fontWeight: "800" },
  actionsRow: { marginTop: 8, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(188, 211, 239, 0.28)",
    backgroundColor: "rgba(177, 202, 231, 0.10)",
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  metaActionText: { color: "#D2E3FF", fontSize: 11, fontWeight: "800" },

  listContent: { paddingHorizontal: 12, paddingTop: 4 },

  jumpBtn: {
    position: "absolute",
    right: 14,
    bottom: 138,
    borderRadius: 999,
    backgroundColor: "#52F1C7",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(88, 255, 211, 0.54)"
  },
  jumpBtnText: { color: "#042B1E", fontWeight: "900", fontSize: 12 },
  msgActionBar: {
    marginTop: -4,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  msgActionBarMine: { justifyContent: "flex-end" },
  msgActionBarTheirs: { justifyContent: "flex-start" },
  reactionQuickBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(193, 215, 246, 0.24)",
    backgroundColor: "rgba(161, 189, 225, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  reactionQuickBtnActive: {
    borderColor: "rgba(92, 236, 194, 0.52)",
    backgroundColor: "rgba(92, 236, 194, 0.22)"
  },
  reactionQuickText: { fontSize: 13 },
  msgIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(193, 215, 246, 0.24)",
    backgroundColor: "rgba(161, 189, 225, 0.12)",
    alignItems: "center",
    justifyContent: "center"
  },

  composerShell: {
    borderTopWidth: 1,
    borderTopColor: "rgba(188, 219, 255, 0.15)",
    backgroundColor: "rgba(8, 20, 34, 0.98)"
  },
  composer: {
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 6
  },
  replyComposerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(175, 206, 243, 0.26)",
    backgroundColor: "rgba(35, 61, 90, 0.60)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  replyComposerStripe: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 99,
    backgroundColor: "#5CECC2"
  },
  replyComposerTitle: { color: "#D9EBFF", fontSize: 11, fontWeight: "900" },
  replyComposerText: { color: "rgba(217, 235, 255, 0.72)", fontSize: 11, marginTop: 1 },
  replyComposerClose: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(152, 180, 218, 0.16)"
  },
  composerMainRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9
  },
  inputCapsule: {
    flex: 1,
    minHeight: 48,
    maxHeight: 126,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(186, 216, 255, 0.24)",
    backgroundColor: "rgba(23, 47, 76, 0.94)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 5
  },
  inputIconWrap: {
    height: 34,
    width: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  inputText: {
    flex: 1,
    maxHeight: 112,
    color: "#EAF3FF",
    fontSize: 14,
    lineHeight: 19,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 2,
    paddingRight: 2
  },
  composerMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#58F2C8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(105, 255, 216, 0.72)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  countText: {
    color: "rgba(201, 223, 252, 0.52)",
    fontSize: 10,
    paddingHorizontal: 4
  },
  footerText: { color: "rgba(233,237,241,0.55)", fontSize: 10, flex: 1, textAlign: "right" }
});
