import { DEMO_MODE } from "./config";
import { liveApi } from "./liveApi";
import { mockApi } from "./mock/api";

export { storage } from "./storage";
export { tokenStorage } from "./tokenStorage";

/** Демо или боевой API — переключение в app.json / EXPO_PUBLIC_DEMO_MODE */
export const api = DEMO_MODE ? mockApi : liveApi;

export { DEMO_MODE };
