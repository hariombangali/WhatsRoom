import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_ROOMS_KEY = "whatsroom.recentRooms";
const PROFILE_KEY = "whatsroom.profile";
const MAX_RECENT_ROOMS = 20;
const ROOM_ID_PATTERN = /^[A-Z0-9]{4,24}$/;

function normalizeRoomId(roomId) {
  const rawValue =
    roomId && typeof roomId === "object" && !Array.isArray(roomId) ? roomId.roomId : roomId;

  const normalized = String(rawValue || "").trim().toUpperCase();
  if (!ROOM_ID_PATTERN.test(normalized)) return "";
  return normalized;
}

function normalizeRecentRoomEntry(raw) {
  if (typeof raw === "string") {
    const roomId = normalizeRoomId(raw);
    if (!roomId) return null;
    return {
      roomId,
      isFavorite: false,
      lastOpenedAt: null
    };
  }

  if (!raw || typeof raw !== "object") return null;

  const roomId = normalizeRoomId(raw.roomId);
  if (!roomId) return null;

  const lastOpenedAt =
    typeof raw.lastOpenedAt === "string" && raw.lastOpenedAt.trim() ? raw.lastOpenedAt : null;

  return {
    roomId,
    isFavorite: Boolean(raw.isFavorite),
    lastOpenedAt
  };
}

function sortRecentRooms(items) {
  return items.slice().sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;

    const aTime = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
    const bTime = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
    return bTime - aTime;
  });
}

function dedupeRecentRooms(items) {
  const byId = new Map();

  for (const item of items) {
    if (!item || !item.roomId) continue;

    const existing = byId.get(item.roomId);
    if (!existing) {
      byId.set(item.roomId, item);
      continue;
    }

    const existingTime = existing.lastOpenedAt ? new Date(existing.lastOpenedAt).getTime() : 0;
    const incomingTime = item.lastOpenedAt ? new Date(item.lastOpenedAt).getTime() : 0;

    byId.set(item.roomId, {
      roomId: item.roomId,
      isFavorite: Boolean(existing.isFavorite || item.isFavorite),
      lastOpenedAt: incomingTime >= existingTime ? item.lastOpenedAt : existing.lastOpenedAt
    });
  }

  return Array.from(byId.values());
}

async function writeRecentRooms(items) {
  await AsyncStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(items));
}

export async function getRecentRooms() {
  try {
    const raw = await AsyncStorage.getItem(RECENT_ROOMS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed.map(normalizeRecentRoomEntry).filter(Boolean);
    const cleaned = sortRecentRooms(dedupeRecentRooms(normalized)).slice(0, MAX_RECENT_ROOMS);

    if (cleaned.length !== parsed.length) {
      writeRecentRooms(cleaned).catch(() => {});
    }

    return cleaned;
  } catch {
    return [];
  }
}

export async function saveRecentRoom(roomId) {
  const id = normalizeRoomId(roomId);
  if (!id) return;

  const prev = await getRecentRooms();
  const existing = prev.find((x) => x.roomId === id);
  const next = dedupeRecentRooms(
    sortRecentRooms([
      {
        roomId: id,
        isFavorite: existing?.isFavorite || false,
        lastOpenedAt: new Date().toISOString()
      },
      ...prev.filter((x) => x.roomId !== id)
    ])
  ).slice(0, MAX_RECENT_ROOMS);

  await writeRecentRooms(next);
  return next;
}

export async function toggleRecentRoomFavorite(roomId) {
  const id = normalizeRoomId(roomId);
  if (!id) return false;

  const prev = await getRecentRooms();
  const next = dedupeRecentRooms(
    prev.map((x) =>
      x.roomId === id
        ? {
            ...x,
            isFavorite: !x.isFavorite
          }
        : x
    )
  );

  await writeRecentRooms(sortRecentRooms(next));
  const updated = next.find((x) => x.roomId === id);
  return Boolean(updated?.isFavorite);
}

export async function removeRecentRoom(roomId) {
  const id = normalizeRoomId(roomId);
  if (!id) return;

  const prev = await getRecentRooms();
  const next = prev.filter((x) => x.roomId !== id);
  await writeRecentRooms(next);
}

export async function clearRecentRooms() {
  await AsyncStorage.removeItem(RECENT_ROOMS_KEY);
}

export async function getProfile() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return { displayName: "" };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { displayName: "" };

    return {
      displayName:
        typeof parsed.displayName === "string" ? parsed.displayName.trim().slice(0, 30) : ""
    };
  } catch {
    return { displayName: "" };
  }
}

export async function getDisplayName() {
  const profile = await getProfile();
  return profile.displayName || "";
}

export async function saveDisplayName(displayName) {
  const nextName = String(displayName || "").trim().slice(0, 30);
  const prev = await getProfile();
  const next = { ...prev, displayName: nextName };

  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}
