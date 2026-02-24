require("dotenv").config();

module.exports = ({ config }) => ({
  ...config,
  owner: "hariombangali",
  name: "WhatsRoom",
  slug: "whatsroom",
  scheme: "whatsroom",
  version: "1.0.0",
  icon: "./assets/icon.png",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  splash: {
    ...(config.splash || {}),
    image: config?.splash?.image || "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0B141A"
  },
  android: {
    ...(config.android || {}),
    package: "com.whatsroom.app",
    softwareKeyboardLayoutMode: "resize",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0B141A"
    }
  },
  web: {
    ...(config.web || {}),
    favicon: "./assets/favicon.png"
  },
  extra: {
    API_BASE_URL:
      process.env.API_BASE_URL || config?.extra?.API_BASE_URL || "https://whatsroom-backend-kz7s.onrender.com",
    eas: {
      projectId: "7bc2b4e1-fe53-4a75-b0ff-2d87760a80aa"
    }
  }
});
