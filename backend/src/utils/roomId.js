const ROOM_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function normalizeRoomId(roomId) {
  return String(roomId || "").trim().toUpperCase();
}

function isValidRoomId(roomId) {
  return /^[A-Z0-9]{4,24}$/.test(String(roomId || ""));
}

function generateRoomId(length) {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * ROOM_ID_ALPHABET.length);
    out += ROOM_ID_ALPHABET[idx];
  }
  return out;
}

module.exports = {
  normalizeRoomId,
  isValidRoomId,
  generateRoomId
};
