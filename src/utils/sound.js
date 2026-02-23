import { Audio } from "expo-av";

let prepared = false;
let loadingPromise = null;
let sendSound = null;

async function ensureAudioMode() {
  if (prepared) return;

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false
  });

  prepared = true;
}

async function ensureSendSound() {
  if (sendSound) return sendSound;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    await ensureAudioMode();
    const result = await Audio.Sound.createAsync(require("../../assets/sounds/send.wav"), {
      shouldPlay: false,
      volume: 0.85
    });
    sendSound = result.sound;
    return sendSound;
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

export async function primeSendTone() {
  try {
    await ensureSendSound();
  } catch {
    // no-op
  }
}

export async function playSendTone() {
  try {
    const sound = await ensureSendSound();
    await sound.replayAsync();
  } catch {
    // no-op
  }
}

export async function unloadSendTone() {
  if (!sendSound) return;

  try {
    await sendSound.unloadAsync();
  } catch {
    // no-op
  } finally {
    sendSound = null;
    prepared = false;
  }
}
