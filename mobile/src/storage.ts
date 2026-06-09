import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEMO_MODE } from "./config";
import { liveApi } from "./liveApi";
import { tokenStorage } from "./tokenStorage";
import type { SavedSearch } from "./types";

export type { SavedSearch };

const FAV_PARTS_KEY = "ftservice_fav_parts";
const FAV_MASTERS_KEY = "ftservice_fav_masters";
const SAVED_SEARCHES_KEY = "ftservice_saved_searches";
const VIEWED_PARTS_KEY = "ftservice_viewed_parts";

function uniq(nums: number[]) {
  return Array.from(new Set(nums));
}

async function useServerSync(): Promise<boolean> {
  if (DEMO_MODE) return false;
  return !!(await tokenStorage.getToken());
}

function searchSignature(entry: Pick<SavedSearch, "label" | "q" | "category" | "part_number" | "car_fit">) {
  return [entry.label, entry.q || "", entry.category || "", entry.part_number || "", entry.car_fit || ""].join("|");
}

function mapServerSearch(s: {
  id: number;
  label: string;
  q?: string | null;
  category?: string | null;
  part_number?: string | null;
  car_fit?: string | null;
  created_at: string;
}): SavedSearch {
  return {
    id: String(s.id),
    label: s.label,
    q: s.q ?? undefined,
    category: s.category ?? undefined,
    part_number: s.part_number ?? undefined,
    car_fit: s.car_fit ?? undefined,
    createdAt: new Date(s.created_at).getTime(),
  };
}

export const storage = {
  ...tokenStorage,

  async getFavoritePartIds(): Promise<number[]> {
    if (await useServerSync()) {
      try {
        const lib = await liveApi.getLibrary();
        return lib.favorite_part_ids;
      } catch {
        /* fallback local */
      }
    }
    const raw = await AsyncStorage.getItem(FAV_PARTS_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  },

  async toggleFavoritePart(id: number): Promise<boolean> {
    if (await useServerSync()) {
      const r = await liveApi.toggleFavoritePart(id);
      return r.active;
    }
    const cur = await storage.getFavoritePartIds();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : uniq([...cur, id]);
    await AsyncStorage.setItem(FAV_PARTS_KEY, JSON.stringify(next));
    return next.includes(id);
  },

  async isFavoritePart(id: number): Promise<boolean> {
    const cur = await storage.getFavoritePartIds();
    return cur.includes(id);
  },

  async getFavoriteMasterIds(): Promise<number[]> {
    if (await useServerSync()) {
      try {
        const lib = await liveApi.getLibrary();
        return lib.favorite_master_ids;
      } catch {
        /* fallback */
      }
    }
    const raw = await AsyncStorage.getItem(FAV_MASTERS_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  },

  async toggleFavoriteMaster(id: number): Promise<boolean> {
    if (await useServerSync()) {
      const r = await liveApi.toggleFavoriteMaster(id);
      return r.active;
    }
    const cur = await storage.getFavoriteMasterIds();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : uniq([...cur, id]);
    await AsyncStorage.setItem(FAV_MASTERS_KEY, JSON.stringify(next));
    return next.includes(id);
  },

  async isFavoriteMaster(id: number): Promise<boolean> {
    const cur = await storage.getFavoriteMasterIds();
    return cur.includes(id);
  },

  async getSavedSearches(): Promise<SavedSearch[]> {
    if (await useServerSync()) {
      try {
        const lib = await liveApi.getLibrary();
        return lib.saved_searches.map(mapServerSearch).sort((a, b) => b.createdAt - a.createdAt);
      } catch {
        /* fallback */
      }
    }
    const raw = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
    const list: SavedSearch[] = raw ? JSON.parse(raw) : [];
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async addSavedSearch(entry: Omit<SavedSearch, "id" | "createdAt">): Promise<SavedSearch> {
    if (await useServerSync()) {
      const row = await liveApi.addSavedSearch(entry);
      return mapServerSearch(row);
    }
    const list = await storage.getSavedSearches();
    const item: SavedSearch = {
      ...entry,
      id: `${Date.now()}`,
      createdAt: Date.now(),
    };
    const sig = searchSignature(item);
    const next = [item, ...list.filter((s) => searchSignature(s) !== sig)].slice(0, 30);
    await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(next));
    return item;
  },

  async removeSavedSearch(id: string): Promise<void> {
    if (await useServerSync()) {
      const numId = parseInt(id, 10);
      if (!Number.isNaN(numId)) {
        await liveApi.removeSavedSearch(numId);
        return;
      }
    }
    const list = await storage.getSavedSearches();
    await AsyncStorage.setItem(
      SAVED_SEARCHES_KEY,
      JSON.stringify(list.filter((s) => s.id !== id))
    );
  },

  async getViewedPartIds(): Promise<number[]> {
    if (await useServerSync()) {
      try {
        const lib = await liveApi.getLibrary();
        return lib.viewed_part_ids;
      } catch {
        /* fallback */
      }
    }
    const raw = await AsyncStorage.getItem(VIEWED_PARTS_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  },

  async addViewedPart(id: number): Promise<void> {
    if (await useServerSync()) {
      try {
        await liveApi.markViewedPart(id);
        return;
      } catch {
        /* fallback */
      }
    }
    const cur = await storage.getViewedPartIds();
    const next = uniq([id, ...cur.filter((x) => x !== id)]).slice(0, 50);
    await AsyncStorage.setItem(VIEWED_PARTS_KEY, JSON.stringify(next));
  },

  async clearViewedParts(): Promise<void> {
    if (await useServerSync()) {
      await liveApi.clearViewedParts();
      return;
    }
    await AsyncStorage.removeItem(VIEWED_PARTS_KEY);
  },
};
