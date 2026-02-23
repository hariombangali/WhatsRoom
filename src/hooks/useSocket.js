import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getApiCandidates, setActiveApiUrl } from "../api/client";

/**
 * Single Socket.IO connection per app session.
 * Uses local state only, no global stores.
 */
export function useSocket() {
  const socketRef = useRef(null);
  const connectPromiseRef = useRef(null);
  const [status, setStatus] = useState("offline"); // offline | connecting | online
  const joinRef = useRef({ roomId: null, senderId: null, displayName: null });

  const waitForConnect = useCallback((s) => {
    if (!s) return Promise.reject(new Error("Socket not initialized"));
    if (s.connected) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        s.off("connect", onConnect);
        s.off("connect_error", onError);
        reject(new Error("Connection timed out"));
      }, 8000);

      function onConnect() {
        clearTimeout(t);
        s.off("connect_error", onError);
        resolve();
      }

      function onError() {
        clearTimeout(t);
        s.off("connect", onConnect);
        reject(new Error("Connection failed"));
      }

      s.once("connect", onConnect);
      s.once("connect_error", onError);
    });
  }, []);

  const emitAck = useCallback((s, event, payload, timeoutMs = 8000) => {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`${event} timeout`)), timeoutMs);
      s.emit(event, payload, (ack) => {
        clearTimeout(t);
        resolve(ack);
      });
    });
  }, []);

  const connect = useCallback(async () => {
    // Reuse the same client across reconnect cycles.
    if (socketRef.current) return socketRef.current;
    if (connectPromiseRef.current) return connectPromiseRef.current;

    connectPromiseRef.current = (async () => {
      setStatus("connecting");

      const candidates = getApiCandidates();
      let lastError = null;

      for (let i = 0; i < candidates.length; i++) {
        const baseUrl = candidates[i];
        const s = io(baseUrl, {
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 400,
          reconnectionDelayMax: 2000,
          timeout: 8000
        });

        s.on("connect", () => setStatus("online"));
        s.on("disconnect", () => setStatus("offline"));
        s.on("connect_error", () => setStatus("offline"));

        // Re-join after reconnect for a smooth UX.
        s.on("connect", async () => {
          const { roomId, senderId, displayName } = joinRef.current || {};
          if (roomId && senderId) {
            s.emit("join-room", { roomId, senderId, displayName }, () => {});
          }
        });

        try {
          await waitForConnect(s);
          setActiveApiUrl(baseUrl);
          socketRef.current = s;
          return s;
        } catch (e) {
          lastError = e;
          s.removeAllListeners();
          s.disconnect();
        }
      }

      setStatus("offline");
      throw lastError || new Error("Unable to connect to chat server");
    })();

    try {
      return await connectPromiseRef.current;
    } finally {
      connectPromiseRef.current = null;
    }
  }, [waitForConnect]);

  const connectAndJoin = useCallback(
    async ({ roomId, senderId, displayName }) => {
      joinRef.current = { roomId, senderId, displayName: displayName || null };

      const s = await connect();
      await waitForConnect(s);

      const ack = await emitAck(s, "join-room", { roomId, senderId, displayName: displayName || null });
      if (ack?.ok) return ack;
      throw new Error(ack?.error || "Join failed");
    },
    [connect, waitForConnect, emitAck]
  );

  const leaveRoom = useCallback(async () => {
    const s = socketRef.current;
    joinRef.current = { roomId: null, senderId: null, displayName: null };

    if (!s || !s.connected) return;

    await emitAck(s, "leave-room", undefined).catch(() => {});
  }, [emitAck]);

  const sendMessage = useCallback(async ({ message, clientMessageId }) => {
    const s = socketRef.current;
    if (!s || !s.connected) throw new Error("Offline");

    const ack = await emitAck(s, "send-message", { message, clientMessageId });
    if (ack?.ok) return ack.serverMessage;
    throw new Error(ack?.error || "Send failed");
  }, [emitAck]);

  const setTyping = useCallback((isTyping) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit("typing", { isTyping: Boolean(isTyping) });
  }, []);

  const markSeen = useCallback(async () => {
    const s = socketRef.current;
    if (!s || !s.connected) return false;

    const ack = await emitAck(s, "mark-seen", {});
    return Boolean(ack?.ok);
  }, [emitAck]);

  const toggleReaction = useCallback(async ({ messageId, emoji }) => {
    const s = socketRef.current;
    if (!s || !s.connected) throw new Error("Offline");

    const ack = await emitAck(s, "toggle-reaction", { messageId, emoji });
    if (ack?.ok) return ack;
    throw new Error(ack?.error || "Reaction failed");
  }, [emitAck]);

  // Cleanup socket on unmount of last consumer (safe).
  useEffect(() => {
    return () => {
      const s = socketRef.current;
      if (s) {
        s.removeAllListeners();
        s.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return useMemo(
    () => ({
      socket: socketRef.current,
      status,
      connectAndJoin,
      leaveRoom,
      sendMessage,
      setTyping,
      markSeen,
      toggleReaction
    }),
    [status, connectAndJoin, leaveRoom, sendMessage, setTyping, markSeen, toggleReaction]
  );
}
