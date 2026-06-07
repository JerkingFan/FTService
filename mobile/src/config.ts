import Constants from "expo-constants";

type Extra = {
  demoMode?: boolean;
  apiUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/**
 * Демо без сервера: EXPO_PUBLIC_DEMO_MODE=true или app.json → "demoMode": true
 * Боевой API: demoMode false + apiUrl на ваш сервер.
 */
export const DEMO_MODE =
  process.env.EXPO_PUBLIC_DEMO_MODE === "true" ||
  (process.env.EXPO_PUBLIC_DEMO_MODE !== "false" && extra.demoMode !== false);

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  extra.apiUrl?.replace(/\/$/, "") ||
  "http://213.155.9.130/api";
