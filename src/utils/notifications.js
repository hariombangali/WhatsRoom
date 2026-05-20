import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const CHAT_CHANNEL_ID = "chat-messages";

let initialized = false;
let permissionAsked = false;

function isPermissionGranted(settings) {
  if (!settings) return false;
  if (settings.granted) return true;
  return String(settings.status || "").toLowerCase() === "granted";
}

export async function initNotifications() {
  if (initialized) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false
    })
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHAT_CHANNEL_ID, {
      name: "Chat messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
    });
  }

  initialized = true;
}

export async function ensureNotificationPermission() {
  await initNotifications();

  try {
    const current = await Notifications.getPermissionsAsync();
    if (isPermissionGranted(current)) return true;

    if (!permissionAsked) {
      permissionAsked = true;
      const requested = await Notifications.requestPermissionsAsync();
      return isPermissionGranted(requested);
    }
  } catch {
    // no-op
  }

  return false;
}

export async function notifyIncomingMessage({ roomId, senderName, message }) {
  try {
    await initNotifications();
    const granted = await ensureNotificationPermission();
    if (!granted) return;

    const sender = String(senderName || "").trim();
    const title = sender || `New message in ${String(roomId || "").trim().toUpperCase() || "chat"}`;
    const body = String(message || "").trim().slice(0, 180) || "Sent a message";

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        channelId: CHAT_CHANNEL_ID,
        data: {
          roomId: String(roomId || "").trim().toUpperCase() || null
        }
      },
      trigger: null
    });
  } catch {
    // no-op
  }
}
