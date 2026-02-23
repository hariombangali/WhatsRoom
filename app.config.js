require("dotenv").config();

module.exports = ({ config }) => ({
  ...config,
  name: "WhatsRoom",
  slug: "whatsroom",
  scheme: "whatsroom",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  splash: {
    resizeMode: "contain",
    backgroundColor: "#0B141A"
  },
  android: {
    package: "com.whatsroom.app",
    softwareKeyboardLayoutMode: "resize"
  },
  extra: {
    API_BASE_URL: process.env.API_BASE_URL || "http://10.0.2.2:4000"
  }
});
