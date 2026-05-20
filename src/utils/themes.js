export const CHAT_THEMES = {
  default: {
    id: "default",
    label: "Default",
    backgroundGradient: ["#07101D", "#0A172A", "#08101D"],
    mineBubble: "#37E8BA",
    mineBubbleBorder: "rgba(7, 23, 18, 0.20)",
    mineText: "#053325",
    theirsBubble: "rgba(18, 37, 59, 0.95)",
    theirsBubbleBorder: "rgba(194, 216, 246, 0.20)",
    theirsText: "#EAF3FF",
    accent: "#58F2C8"
  },
  aurora: {
    id: "aurora",
    label: "Aurora",
    backgroundGradient: ["#0B0F2A", "#1A1A60", "#0A1F3B"],
    mineBubble: "#9C7BFF",
    mineBubbleBorder: "rgba(50, 16, 90, 0.30)",
    mineText: "#1A0935",
    theirsBubble: "rgba(40, 28, 78, 0.92)",
    theirsBubbleBorder: "rgba(199, 173, 255, 0.26)",
    theirsText: "#F4ECFF",
    accent: "#B49CFF"
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    backgroundGradient: ["#2A0A1C", "#5B1730", "#1F0815"],
    mineBubble: "#FFA98C",
    mineBubbleBorder: "rgba(80, 20, 10, 0.30)",
    mineText: "#3A0F0F",
    theirsBubble: "rgba(70, 26, 40, 0.94)",
    theirsBubbleBorder: "rgba(255, 192, 168, 0.28)",
    theirsText: "#FFEAD9",
    accent: "#FF8E72"
  },
  retro: {
    id: "retro",
    label: "Retro",
    backgroundGradient: ["#091A14", "#103C2A", "#06170F"],
    mineBubble: "#9CFF73",
    mineBubbleBorder: "rgba(15, 45, 12, 0.30)",
    mineText: "#0C2C0C",
    theirsBubble: "rgba(20, 50, 30, 0.95)",
    theirsBubbleBorder: "rgba(180, 255, 160, 0.30)",
    theirsText: "#E6FFD8",
    accent: "#7EE864"
  },
  cyber: {
    id: "cyber",
    label: "Cyber",
    backgroundGradient: ["#0A0418", "#2A0844", "#10052A"],
    mineBubble: "#FF4FCB",
    mineBubbleBorder: "rgba(60, 10, 50, 0.30)",
    mineText: "#2A0420",
    theirsBubble: "rgba(36, 12, 62, 0.95)",
    theirsBubbleBorder: "rgba(255, 122, 220, 0.30)",
    theirsText: "#F2E3FF",
    accent: "#FF4FCB"
  }
};

export const CHAT_THEME_LIST = Object.values(CHAT_THEMES);

export function getChatTheme(id) {
  return CHAT_THEMES[id] || CHAT_THEMES.default;
}
