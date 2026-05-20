const DISPLAY_FAMILY = "Quicksand_700Bold";
const DISPLAY_SEMIBOLD = "Quicksand_600SemiBold";

export const fontFamilies = {
  display: DISPLAY_FAMILY,
  displaySemibold: DISPLAY_SEMIBOLD
};

export const typography = {
  displayXL: { fontFamily: DISPLAY_FAMILY, fontSize: 32, letterSpacing: 0.2 },
  display: { fontFamily: DISPLAY_FAMILY, fontSize: 26, letterSpacing: 0.2 },
  h1: { fontFamily: DISPLAY_FAMILY, fontSize: 22, letterSpacing: 0.2 },
  h2: { fontFamily: DISPLAY_SEMIBOLD, fontSize: 16, letterSpacing: 0.15 },
  body: { fontSize: 14, fontWeight: "600" },
  bodySoft: { fontSize: 13, fontWeight: "500" },
  caption: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 }
};
