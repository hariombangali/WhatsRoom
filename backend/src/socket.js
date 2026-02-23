const mongoose = require("mongoose");
const { Server } = require("socket.io");
const Message = require("./models/Message");
const Room = require("./models/Room");
const { config } = require("./config");
const { normalizeRoomId, isValidRoomId } = require("./utils/roomId");
const { serializeMessage } = require("./routes/rooms");
const ALLOWED_REACTIONS = new Set(["👍", "❤️", "😂", "🔥", "👏", "😮"]);

function getRoomParticipantCount(io, roomId) {
  const socketIds = io.sockets.adapter.rooms.get(roomId);
  if (!socketIds || socketIds.size === 0) return 0;

  const uniqueSenderIds = new Set();
  for (const socketId of socketIds) {
    const s = io.sockets.sockets.get(socketId);
    const senderId = String(s?.data?.senderId || "").trim();
    if (senderId) uniqueSenderIds.add(senderId);
  }

  return uniqueSenderIds.size;
}

function broadcastOnlineUsers(io, roomId) {
  io.to(roomId).emit("online-users", {
    roomId,
    usersCount: getRoomParticipantCount(io, roomId)
  });
}

function normalizeSenderId(senderId) {
  return String(senderId || "").trim();
}

function normalizeDisplayName(displayName) {
  const value = String(displayName || "").trim();
  if (!value) return null;
  return value.slice(0, 30);
}

function normalizeSeenBy(raw) {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(
      raw
        .map((x) => normalizeSenderId(x))
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
            .map((x) => normalizeSenderId(x))
            .filter(Boolean)
        )
      );

      if (!users.length) return null;

      return { emoji, users };
    })
    .filter(Boolean);
}

function isValidMessageId(messageId) {
  return mongoose.Types.ObjectId.isValid(String(messageId || "").trim());
}

function safeAck(ack, payload) {
  if (typeof ack === "function") ack(payload);
}

async function markMessagesSeen(io, { roomId, readerId }) {
  if (!roomId || !readerId) return [];

  const docs = await Message.find({
    roomId,
    senderId: { $ne: readerId },
    seenBy: { $ne: readerId }
  })
    .sort({ timestamp: 1, _id: 1 })
    .select({ _id: 1, seenBy: 1 })
    .lean();

  if (!docs.length) return [];

  const seenAt = new Date();

  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id, seenBy: { $ne: readerId } },
      update: {
        $addToSet: { seenBy: readerId },
        $set: { seenAt }
      }
    }
  }));

  if (ops.length) {
    await Message.bulkWrite(ops, { ordered: false });
  }

  const messages = docs.map((doc) => ({
    _id: String(doc._id),
    seenBy: normalizeSeenBy([...(Array.isArray(doc.seenBy) ? doc.seenBy : []), readerId]),
    seenAt: seenAt.toISOString()
  }));

  io.to(roomId).emit("messages-seen", {
    roomId,
    readerId,
    seenAt: seenAt.toISOString(),
    messages
  });

  return messages;
}

function createSocketServer(httpServer, { corsOrigins }) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins === "*" ? true : corsOrigins,
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    socket.data.roomId = null;
    socket.data.senderId = null;
    socket.data.displayName = null;

    socket.on("join-room", async (payload, ack) => {
      try {
        const roomId = normalizeRoomId(payload?.roomId);
        const senderId = normalizeSenderId(payload?.senderId);
        const displayName = normalizeDisplayName(payload?.displayName);

        if (!isValidRoomId(roomId)) {
          safeAck(ack, { ok: false, error: "Invalid room id" });
          return;
        }

        if (!senderId) {
          safeAck(ack, { ok: false, error: "Invalid sender id" });
          return;
        }

        const room = await Room.findOne({ roomId }).lean();
        if (!room) {
          safeAck(ack, { ok: false, error: "Room not found" });
          return;
        }

        const previousRoomId = socket.data.roomId;
        if (previousRoomId && previousRoomId !== roomId) {
          socket.leave(previousRoomId);
          broadcastOnlineUsers(io, previousRoomId);
        }

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.senderId = senderId;
        socket.data.displayName = displayName;

        await markMessagesSeen(io, { roomId, readerId: senderId });
        broadcastOnlineUsers(io, roomId);

        safeAck(ack, {
          ok: true,
          roomId,
          senderId,
          displayName,
          usersCount: getRoomParticipantCount(io, roomId)
        });
      } catch (e) {
        safeAck(ack, { ok: false, error: "Join failed" });
      }
    });

    socket.on("leave-room", (ack) => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.leave(roomId);
        broadcastOnlineUsers(io, roomId);
      }

      socket.data.roomId = null;
      socket.data.senderId = null;
      socket.data.displayName = null;
      safeAck(ack, { ok: true });
    });

    socket.on("typing", (payload) => {
      const roomId = socket.data.roomId;
      const senderId = socket.data.senderId;
      const senderName = socket.data.displayName || null;
      if (!roomId || !senderId) return;

      socket.to(roomId).emit("typing", {
        roomId,
        senderId,
        senderName,
        isTyping: Boolean(payload?.isTyping)
      });
    });

    socket.on("mark-seen", async (_payload, ack) => {
      try {
        const roomId = socket.data.roomId;
        const readerId = socket.data.senderId;
        if (!roomId || !readerId) {
          safeAck(ack, { ok: false, error: "Join a room first" });
          return;
        }

        const updated = await markMessagesSeen(io, { roomId, readerId });
        safeAck(ack, { ok: true, updatedCount: updated.length });
      } catch (e) {
        safeAck(ack, { ok: false, error: "Mark seen failed" });
      }
    });

    socket.on("send-message", async (payload, ack) => {
      try {
        const roomId = socket.data.roomId;
        const senderId = socket.data.senderId;
        const senderName = socket.data.displayName || null;
        const messageText = String(payload?.message || "").trim();
        const replyToMessageId = String(payload?.replyToMessageId || "").trim();
        const clientMessageId = payload?.clientMessageId
          ? String(payload.clientMessageId).trim()
          : null;

        if (!roomId || !senderId) {
          safeAck(ack, { ok: false, error: "Join a room first" });
          return;
        }

        if (!messageText) {
          safeAck(ack, { ok: false, error: "Message cannot be empty" });
          return;
        }

        if (messageText.length > config.messageMaxLength) {
          safeAck(ack, {
            ok: false,
            error: `Message too long (max ${config.messageMaxLength} chars)`
          });
          return;
        }

        let doc = null;
        let replyTo = null;

        if (replyToMessageId && isValidMessageId(replyToMessageId)) {
          const source = await Message.findOne({ _id: replyToMessageId, roomId })
            .select({ _id: 1, senderId: 1, senderName: 1, message: 1 })
            .lean();

          if (source) {
            replyTo = {
              messageId: String(source._id),
              senderId: source.senderId || null,
              senderName: source.senderName || null,
              message: String(source.message || "").slice(0, 180)
            };
          }
        }

        if (clientMessageId) {
          doc = await Message.findOne({ roomId, senderId, clientMessageId });
        }

        if (!doc) {
          doc = await Message.create({
            roomId,
            senderId,
            senderName,
            replyTo,
            message: messageText,
            clientMessageId: clientMessageId || null,
            seenBy: [senderId],
            seenAt: null,
            reactions: [],
            timestamp: new Date()
          });
        } else if (senderName && doc.senderName !== senderName) {
          doc.senderName = senderName;
          doc.seenBy = normalizeSeenBy([...(Array.isArray(doc.seenBy) ? doc.seenBy : []), senderId]);
          await doc.save();
        } else {
          const nextSeenBy = normalizeSeenBy([...(Array.isArray(doc.seenBy) ? doc.seenBy : []), senderId]);
          if (nextSeenBy.length !== (Array.isArray(doc.seenBy) ? doc.seenBy.length : 0)) {
            doc.seenBy = nextSeenBy;
            await doc.save();
          }
        }

        const serverMessage = serializeMessage(doc);
        io.to(roomId).emit("receive-message", serverMessage);
        safeAck(ack, { ok: true, serverMessage });
      } catch (e) {
        if (e?.code === 11000 && payload?.clientMessageId) {
          const roomId = socket.data.roomId;
          const senderId = socket.data.senderId;
          const doc = await Message.findOne({
            roomId,
            senderId,
            clientMessageId: String(payload.clientMessageId)
          });

          if (doc) {
            const serverMessage = serializeMessage(doc);
            io.to(roomId).emit("receive-message", serverMessage);
            safeAck(ack, { ok: true, serverMessage });
            return;
          }
        }

        safeAck(ack, { ok: false, error: "Send failed" });
      }
    });

    socket.on("toggle-reaction", async (payload, ack) => {
      try {
        const roomId = socket.data.roomId;
        const senderId = socket.data.senderId;
        const messageId = String(payload?.messageId || "").trim();
        const emoji = String(payload?.emoji || "").trim();

        if (!roomId || !senderId) {
          safeAck(ack, { ok: false, error: "Join a room first" });
          return;
        }

        if (!isValidMessageId(messageId)) {
          safeAck(ack, { ok: false, error: "Invalid message id" });
          return;
        }

        if (!ALLOWED_REACTIONS.has(emoji)) {
          safeAck(ack, { ok: false, error: "Reaction not supported" });
          return;
        }

        const doc = await Message.findOne({ _id: messageId, roomId });
        if (!doc) {
          safeAck(ack, { ok: false, error: "Message not found" });
          return;
        }

        const reactions = normalizeReactions(doc.reactions);
        const index = reactions.findIndex((x) => x.emoji === emoji);

        if (index === -1) {
          reactions.push({ emoji, users: [senderId] });
        } else {
          const users = reactions[index].users.filter((u) => u !== senderId);
          if (users.length === reactions[index].users.length) {
            users.push(senderId);
          }

          if (users.length === 0) {
            reactions.splice(index, 1);
          } else {
            reactions[index] = { ...reactions[index], users };
          }
        }

        doc.reactions = reactions;
        await doc.save();

        const payloadOut = {
          roomId,
          messageId: String(doc._id),
          reactions: reactions.map((x) => ({
            emoji: x.emoji,
            users: x.users,
            count: x.users.length
          }))
        };

        io.to(roomId).emit("message-reaction-updated", payloadOut);
        safeAck(ack, { ok: true, ...payloadOut });
      } catch (e) {
        safeAck(ack, { ok: false, error: "Reaction failed" });
      }
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (roomId) {
        broadcastOnlineUsers(io, roomId);
      }
    });
  });

  return io;
}

module.exports = {
  createSocketServer
};
