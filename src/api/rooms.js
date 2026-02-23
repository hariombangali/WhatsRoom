import { api, getApiCandidates, setActiveApiUrl } from "./client";

async function requestWithFallback(config) {
  const candidates = getApiCandidates();
  let lastError = null;

  for (let i = 0; i < candidates.length; i++) {
    const baseURL = candidates[i];

    try {
      const res = await api.request({ ...config, baseURL });
      setActiveApiUrl(baseURL);
      return res;
    } catch (e) {
      lastError = e;
      const canRetry = Boolean(e?.isNetworkError);
      if (!canRetry || i === candidates.length - 1) throw e;
    }
  }

  throw lastError || new Error("Network error");
}

export async function createRoom() {
  const res = await requestWithFallback({ method: "post", url: "/api/rooms" });
  if (!res?.data?.ok) throw new Error("Failed to create room");
  return res.data;
}

export async function validateRoom(roomId) {
  const res = await requestWithFallback({
    method: "get",
    url: `/api/rooms/${encodeURIComponent(roomId)}`
  });
  if (!res?.data?.ok) throw new Error("Room not found");
  return res.data;
}

export async function getRoomMessages(roomId) {
  const res = await requestWithFallback({
    method: "get",
    url: `/api/rooms/${encodeURIComponent(roomId)}/messages?limit=120`
  });
  if (!res?.data?.ok) throw new Error("Failed to load messages");
  return res.data;
}
