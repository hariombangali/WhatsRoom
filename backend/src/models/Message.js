const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    senderId: {
      type: String,
      required: true,
      trim: true
    },
    senderName: {
      type: String,
      default: null,
      trim: true
    },
    replyTo: {
      messageId: {
        type: String,
        default: null
      },
      senderId: {
        type: String,
        default: null
      },
      senderName: {
        type: String,
        default: null
      },
      message: {
        type: String,
        default: null
      }
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    clientMessageId: {
      type: String,
      default: null
    },
    seenBy: {
      type: [String],
      default: []
    },
    seenAt: {
      type: Date,
      default: null
    },
    reactions: {
      type: [
        {
          emoji: {
            type: String,
            required: true,
            trim: true
          },
          users: {
            type: [String],
            default: []
          }
        }
      ],
      default: []
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

MessageSchema.index({ roomId: 1, timestamp: 1 });
MessageSchema.index({ roomId: 1, senderId: 1, clientMessageId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Message", MessageSchema);
