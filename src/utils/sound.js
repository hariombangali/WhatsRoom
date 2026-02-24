import { Audio } from "expo-av";

let prepared = false;
let sendSound = null;
let deleteSound = null;
let clearSound = null;

let sendLoadingPromise = null;
let deleteLoadingPromise = null;
let clearLoadingPromise = null;

function shouldResetAudioMode() {
  return !sendSound && !deleteSound && !clearSound;
}

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
  if (sendLoadingPromise) return sendLoadingPromise;

  sendLoadingPromise = (async () => {
    await ensureAudioMode();
    const result = await Audio.Sound.createAsync(require("../../assets/sounds/send.wav"), {
      shouldPlay: false,
      volume: 0.85
    });
    sendSound = result.sound;
    return sendSound;
  })();

  try {
    return await sendLoadingPromise;
  } finally {
    sendLoadingPromise = null;
  }
}

async function ensureDeleteSound() {
  if (deleteSound) return deleteSound;
  if (deleteLoadingPromise) return deleteLoadingPromise;

  deleteLoadingPromise = (async () => {
    await ensureAudioMode();
    const result = await Audio.Sound.createAsync(require("../../assets/sounds/delete.wav"), {
      shouldPlay: false,
      volume: 0.72
    });
    deleteSound = result.sound;
    return deleteSound;
  })();

  try {
    return await deleteLoadingPromise;
  } finally {
    deleteLoadingPromise = null;
  }
}

async function ensureClearSound() {
  if (clearSound) return clearSound;
  if (clearLoadingPromise) return clearLoadingPromise;

  clearLoadingPromise = (async () => {
    await ensureAudioMode();
    const result = await Audio.Sound.createAsync(require("../../assets/sounds/clear.wav"), {
      shouldPlay: false,
      volume: 0.74
    });
    clearSound = result.sound;
    return clearSound;
  })();

  try {
    return await clearLoadingPromise;
  } finally {
    clearLoadingPromise = null;
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
    if (shouldResetAudioMode()) {
      prepared = false;
    }
  }
}

export async function primeActionTone() {
  try {
    await Promise.all([ensureDeleteSound(), ensureClearSound()]);
  } catch {
    // no-op
  }
}

export async function playDeleteTone() {
  try {
    const sound = await ensureDeleteSound();
    await sound.replayAsync();
  } catch {
    // no-op
  }
}

export async function playClearTone() {
  try {
    const sound = await ensureClearSound();
    await sound.replayAsync();
  } catch {
    // no-op
  }
}

export async function unloadActionTone() {
  const unloadTasks = [];
  if (deleteSound) unloadTasks.push(deleteSound.unloadAsync().catch(() => {}));
  if (clearSound) unloadTasks.push(clearSound.unloadAsync().catch(() => {}));
  if (unloadTasks.length === 0) return;

  try {
    await Promise.all(unloadTasks);
  } finally {
    deleteSound = null;
    clearSound = null;
    if (shouldResetAudioMode()) {
      prepared = false;
    }
  }
}
