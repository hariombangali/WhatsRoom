const dotenv = require("dotenv");

dotenv.config();

function parseIntEnv(name, fallback, { min, max } = {}) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;

  if (typeof min === "number" && parsed < min) return fallback;
  if (typeof max === "number" && parsed > max) return fallback;
  return parsed;
}

function parseCorsOrigins(value) {
  const raw = String(value || "*").trim();
  if (!raw || raw === "*") return "*";

  const list = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  return list.length ? list : "*";
}

const config = {
  port: parseIntEnv("PORT", 4000, { min: 1, max: 65535 }),
  mongodbUri: String(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/whatsroom").trim(),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  roomIdLength: parseIntEnv("ROOM_ID_LENGTH", 8, { min: 4, max: 16 }),
  messageMaxLength: parseIntEnv("MESSAGE_MAX_LENGTH", 2000, { min: 20, max: 10000 })
};

module.exports = { config };
