const express = require("express");
const Room = require("../models/Room");
const Message = require("../models/Message");
const { config } = require("../config");
const { generateRoomId, isValidRoomId, normalizeRoomId } = require("../utils/roomId");

const router = express.Router();

function serializeMessage(m) {
  const replyTo =
    m?.replyTo && m.replyTo.messageId
      ? {
          messageId: String(m.replyTo.messageId),
          senderId: m.replyTo.senderId ? String(m.replyTo.senderId) : null,
          senderName: m.replyTo.senderName ? String(m.replyTo.senderName) : null,
          message: m.replyTo.message ? String(m.replyTo.message) : null
        }
      : null;

  const reactions = Array.isArray(m?.reactions)
    ? m.reactions
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

          if (!users.length) return null;

          return {
            emoji,
            users,
            count: users.length
          };
        })
        .filter(Boolean)
    : [];

  return {
    _id: String(m._id),
    roomId: m.roomId,
    senderId: m.senderId,
    senderName: m.senderName || null,
    replyTo,
    message: m.message,
    timestamp: new Date(m.timestamp).toISOString(),
    clientMessageId: m.clientMessageId || null,
    seenBy: Array.isArray(m.seenBy) ? m.seenBy.map((x) => String(x || "").trim()).filter(Boolean) : [],
    seenAt: m.seenAt ? new Date(m.seenAt).toISOString() : null,
    reactions
  };
}

async function createUniqueRoomId(maxAttempts = 8) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const roomId = generateRoomId(config.roomIdLength);

    try {
      const room = await Room.create({ roomId });
      return room.roomId;
    } catch (e) {
      // Retry on duplicate key collisions.
      if (e?.code !== 11000) throw e;
    }
  }

  throw new Error("Could not allocate unique room id");
}

router.post("/", async (req, res, next) => {
  try {
    const roomId = await createUniqueRoomId();
    return res.json({ ok: true, roomId });
  } catch (e) {
    return next(e);
  }
});

router.get("/:roomId", async (req, res, next) => {
  try {
    const roomId = normalizeRoomId(req.params.roomId);
    if (!isValidRoomId(roomId)) {
      return res.status(400).json({ ok: false, error: "Invalid room id" });
    }

    const room = await Room.findOne({ roomId }).lean();
    if (!room) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    return res.json({
      ok: true,
      roomId: room.roomId,
      createdAt: new Date(room.createdAt).toISOString()
    });
  } catch (e) {
    return next(e);
  }
});

router.get("/:roomId/messages", async (req, res, next) => {
  try {
    const roomId = normalizeRoomId(req.params.roomId);
    if (!isValidRoomId(roomId)) {
      return res.status(400).json({ ok: false, error: "Invalid room id" });
    }

    const room = await Room.findOne({ roomId }).lean();
    if (!room) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    const limitRaw = Number.parseInt(String(req.query.limit || "120"), 10);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 200)) : 120;

    const docs = await Message.find({ roomId })
      .sort({ timestamp: -1, _id: -1 })
      .limit(limit)
      .lean();

    const messages = docs.reverse().map(serializeMessage);

    return res.json({
      ok: true,
      roomId,
      messages
    });
  } catch (e) {
    return next(e);
  }
});

module.exports = {
  roomsRouter: router,
  serializeMessage
};
