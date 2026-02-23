import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "whatsroom.senderId";

function makeId() {
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Device-level identity (no auth). Stable across app restarts.
 */
export function useSenderId() {
  const [senderId, setSenderId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const existing = await AsyncStorage.getItem(KEY);
        if (!mounted) return;

        if (existing) {
          setSenderId(existing);
        } else {
          const id = makeId();
          await AsyncStorage.setItem(KEY, id);
          setSenderId(id);
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { senderId, ready };
}
