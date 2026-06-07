import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "./types";

const TOKEN_KEY = "ftservice_token";
const USER_KEY = "ftservice_user";

export const tokenStorage = {
  async getToken() {
    return AsyncStorage.getItem(TOKEN_KEY);
  },
  async getUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setAuth(token: string, user: User) {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ]);
  },
  async clear() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },
};
