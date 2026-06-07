import { request, type Paginated } from "./http";
import { tokenStorage } from "./tokenStorage";
import type {
  AppConfig,
  BookingPayload,
  CabinetData,
  Category,
  Master,
  Part,
  User,
} from "./types";
import { enrichPartImages } from "./utils/stockImages";
import { API_BASE } from "./config";
import type { SavedSearch } from "./types";

function withImages(part: Part): Part {
  if (part.images?.length) return part;
  return enrichPartImages(part);
}

function partsQuery(params: Record<string, unknown>) {
  const q = new URLSearchParams();
  if (params.q) q.set("q", String(params.q));
  if (params.part_number) q.set("part_number", String(params.part_number));
  if (params.car_fit) q.set("car_fit", String(params.car_fit));
  if (params.category && params.category !== "all") q.set("category", String(params.category));
  if (params.condition && params.condition !== "all") q.set("condition", String(params.condition));
  if (params.location) q.set("location", String(params.location));
  if (params.verifiedOnly) q.set("verified_only", "1");
  if (params.sort) q.set("sort", String(params.sort));
  if (params.minPrice) q.set("min_price", String(params.minPrice));
  if (params.maxPrice) q.set("max_price", String(params.maxPrice));
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(params.limit ?? 100));
  return q.toString();
}

export const liveApi = {
  health: () => request<{ status: string; service?: string }>("/health"),
  getConfig: () => request<AppConfig>("/config"),
  me: () => request<User>("/auth/me"),
  getCategories: () => request<Category[]>("/parts/categories"),
  getParts: async (
    params: {
      q?: string;
      part_number?: string;
      car_fit?: string;
      category?: string;
      condition?: string;
      minPrice?: number;
      maxPrice?: number;
      location?: string;
      verifiedOnly?: boolean;
      sort?: "newest" | "price_asc" | "price_desc";
      page?: number;
      limit?: number;
    } = {}
  ) => {
    const qs = partsQuery(params);
    const res = await request<Paginated<Part>>(`/parts?${qs}`);
    return res.items.map(withImages);
  },
  getPart: async (id: number) => withImages(await request<Part>(`/parts/${id}`)),
  getMasters: async (
    params: { q?: string; lat?: number; lng?: number; radius_km?: number; page?: number; limit?: number } = {}
  ) => {
    const q = new URLSearchParams();
    if (params.q) q.set("q", params.q);
    if (params.lat != null) q.set("lat", String(params.lat));
    if (params.lng != null) q.set("lng", String(params.lng));
    if (params.radius_km) q.set("radius_km", String(params.radius_km));
    q.set("page", String(params.page ?? 1));
    q.set("limit", String(params.limit ?? 100));
    const res = await request<Paginated<Master>>(`/masters?${q.toString()}`);
    return res.items;
  },
  getNearbyMasters: (lat: number, lng: number, radius_km = 15) =>
    request<Master[]>(`/masters/nearby?lat=${lat}&lng=${lng}&radius_km=${radius_km}`),
  login: async (email: string, password: string) => {
    const data = await request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    await tokenStorage.setAuth(data.access_token, data.user);
    return data;
  },
  register: async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: string;
    district?: string;
    spec?: string;
  }) => {
    const data = await request<{ access_token: string; user: User; message?: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          email: payload.email.trim(),
          password: payload.password,
          full_name: payload.full_name.trim(),
          phone: payload.phone?.trim() || null,
          role: payload.role,
          district: payload.district?.trim() || null,
          spec: payload.spec?.trim() || null,
        }),
      }
    );
    await tokenStorage.setAuth(data.access_token, data.user);
    return data;
  },
  submitPart: (payload: Record<string, unknown>) =>
    request("/parts/submissions", { method: "POST", body: JSON.stringify(payload) }),
  createBooking: (payload: BookingPayload) =>
    request("/bookings", { method: "POST", body: JSON.stringify(payload) }),
  getCabinet: () => request<CabinetData>("/bookings/cabinet"),
  getSellerDashboard: () => request("/seller/dashboard"),
  uploadImages: async (form: FormData) => {
    const token = await tokenStorage.getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/uploads/images`, {
      method: "POST",
      headers,
      body: form,
    });
    if (!res.ok) throw new Error("Не удалось загрузить фото");
    return res.json() as Promise<{ urls: string[] }>;
  },
  getLibrary: () =>
    request<{
      favorite_part_ids: number[];
      favorite_master_ids: number[];
      viewed_part_ids: number[];
      saved_searches: Array<{
        id: number;
        label: string;
        q?: string | null;
        category?: string | null;
        part_number?: string | null;
        created_at: string;
      }>;
    }>("/me/library"),
  toggleFavoritePart: (id: number) =>
    request<{ active: boolean }>(`/me/favorites/parts/${id}`, { method: "POST" }),
  toggleFavoriteMaster: (id: number) =>
    request<{ active: boolean }>(`/me/favorites/masters/${id}`, { method: "POST" }),
  markViewedPart: (id: number) =>
    request(`/me/viewed/parts/${id}`, { method: "POST" }),
  clearViewedParts: () => request(`/me/viewed/parts`, { method: "DELETE" }),
  addSavedSearch: (entry: Omit<SavedSearch, "id" | "createdAt">) =>
    request<{
      id: number;
      label: string;
      q?: string | null;
      category?: string | null;
      part_number?: string | null;
      created_at: string;
    }>("/me/saved-searches", { method: "POST", body: JSON.stringify(entry) }),
  removeSavedSearch: (id: number) =>
    request(`/me/saved-searches/${id}`, { method: "DELETE" }),
  logout: async () => {
    await tokenStorage.clear();
  },
};
