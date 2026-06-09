import { Platform } from "react-native";

export const colors = {
  // legacy aliases (screens still migrating)
  white: "#FFFFFF",
  gray100: "#F4F5F7",
  gray200: "#E8ECF0",
  gray500: "#8B95A1",
  gray700: "#5C6570",
  gray900: "#14171A",
  orangeLight: "#FFF4EB",
  red: "#E03E3E",

  orange: "#E85D04",
  orangeDark: "#C44D03",
  orangeSoft: "#FFF4EB",
  orangeMuted: "#FFD4B0",
  bg: "#F7F8FA",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  text: "#14171A",
  textSecondary: "#5C6570",
  textMuted: "#8B95A1",
  border: "#E8ECF0",
  borderLight: "#F0F2F5",
  green: "#1A9F4A",
  greenSoft: "#E8F8EE",
  telegram: "#229ED9",
  telegramSoft: "#E8F4FC",
  star: "#F5A623",
  danger: "#E03E3E",
  verified: "#0D7A3E",
  used: "#6B7280",
  new: "#2563EB",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const shadow = Platform.select({
  ios: {
    card: {
      shadowColor: "#14171A",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    float: {
      shadowColor: "#14171A",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
  },
  android: { card: { elevation: 2 }, float: { elevation: 6 } },
  default: {},
}) as { card: object; float: object };

export const typography = {
  hero: { fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5 },
  h1: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3 },
  h2: { fontSize: 17, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "500" as const },
  micro: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.3 },
  price: { fontSize: 20, fontWeight: "800" as const, letterSpacing: -0.5 },
};

export const CATEGORY_COLORS: Record<string, string> = {
  engine: "#D84315",
  electrical: "#F9A825",
  general: "#546E7A",
  suspension: "#6A1B9A",
  cooling: "#0277BD",
  transmission: "#2E7D32",
  interior: "#5D4037",
  wheels_tires: "#3949AB",
  fluids: "#00838F",
  body: "#546E7A",
  brakes: "#546E7A",
  wheels: "#3949AB",
  tires: "#3949AB",
};
