import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

const FALLBACK_ANDROID_URL = "http://10.0.2.2:4000";
const FALLBACK_LOCAL_URL = "http://localhost:4000";
const FALLBACK_HOST_PORT = "4000";

function isLocalOrPrivateHost(hostname) {
  const host = String(hostname || "").trim().toLowerCase();
  if (!host) return false;

  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;

  const match172 = host.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (match172) {
    const second = Number.parseInt(match172[1], 10);
    if (Number.isFinite(second) && second >= 16 && second <= 31) return true;
  }

  return false;
}

function normalizeBaseUrl(input) {
  const value = String(input || "").trim().replace(/\/+$/, "");
  if (!value) return null;

  try {
    const u = new URL(value);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

function uniqueUrls(values) {
  const out = [];
  for (const v of values) {
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

function getWebHostFallbackUrl() {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;

  const protocol = window.location?.protocol || "http:";
  const host = window.location?.hostname || "localhost";
  return `${protocol}//${host}:${FALLBACK_HOST_PORT}`;
}

function getConfiguredHostFallbackUrl(configuredUrl) {
  if (!configuredUrl) return null;

  try {
    const u = new URL(configuredUrl);
    if (u.port === FALLBACK_HOST_PORT) return null;
    if (!isLocalOrPrivateHost(u.hostname)) return null;
    return `${u.protocol}//${u.hostname}:${FALLBACK_HOST_PORT}`;
  } catch {
    return null;
  }
}

const CONFIGURED_API_BASE_URL = normalizeBaseUrl(
  Constants?.expoConfig?.extra?.API_BASE_URL || Constants?.manifest?.extra?.API_BASE_URL
);

const DEFAULT_API_BASE_URL = Platform.OS === "android" ? FALLBACK_ANDROID_URL : FALLBACK_LOCAL_URL;

const API_CANDIDATES = uniqueUrls([
  CONFIGURED_API_BASE_URL,
  getConfiguredHostFallbackUrl(CONFIGURED_API_BASE_URL),
  getWebHostFallbackUrl(),
  FALLBACK_ANDROID_URL,
  FALLBACK_LOCAL_URL,
  DEFAULT_API_BASE_URL
]);

let activeApiUrl = API_CANDIDATES[0] || DEFAULT_API_BASE_URL;

export const api = axios.create({
  baseURL: activeApiUrl,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json"
  }
});

export function getApiCandidates() {
  return uniqueUrls([activeApiUrl, ...API_CANDIDATES]);
}

export function getActiveApiUrl() {
  return activeApiUrl;
}

export function setActiveApiUrl(url) {
  const normalized = normalizeBaseUrl(url);
  if (!normalized) return;
  activeApiUrl = normalized;
  api.defaults.baseURL = normalized;
}

export function normalizeApiError(err) {
  const status = err?.response?.status;
  const hasResponse = Boolean(err?.response);
  const target = String(err?.config?.baseURL || activeApiUrl || "server");
  const backendMessage = err?.response?.data?.error;

  let message = "Network error";
  if (backendMessage) {
    message = String(backendMessage);
  } else if (err?.code === "ECONNABORTED" || String(err?.message || "").toLowerCase().includes("timeout")) {
    message = `Request timed out while connecting to ${target}. Check API_BASE_URL and backend availability.`;
  } else if (!hasResponse) {
    message = `Unable to reach ${target}. Check API_BASE_URL and backend availability.`;
  } else if (err?.message) {
    message = String(err.message);
  }

  const normalized = new Error(message);
  normalized.status = status ?? null;
  normalized.isNetworkError = !hasResponse;
  return normalized;
}

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(normalizeApiError(err))
);

export function getApiUrl() {
  return activeApiUrl;
}
