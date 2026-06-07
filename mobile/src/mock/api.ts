import type { BookingPayload, Master, Part, User } from "../types";
import { storage } from "../storage";
import { enrichPartImages } from "../utils/stockImages";
import { haversineKm } from "./geo";
import {
  MOCK_CABINET,
  MOCK_CATEGORIES,
  MOCK_CONFIG,
  MOCK_MASTERS,
  MOCK_PARTS,
  MOCK_USER,
} from "./data";

const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms));

function filterParts(params: {
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
}): Part[] {
  let list = [...MOCK_PARTS];
  if (params.category && params.category !== "all") {
    list = list.filter((p) => p.category === params.category);
  }
  if (params.condition && params.condition !== "all") {
    list = list.filter((p) => p.condition === params.condition);
  }
  if (params.verifiedOnly) {
    list = list.filter((p) => p.verified);
  }
  if (params.location) {
    const loc = params.location.toLowerCase();
    list = list.filter((p) => (p.location || "").toLowerCase().includes(loc));
  }
  if (params.minPrice) {
    list = list.filter((p) => p.price >= params.minPrice!);
  }
  if (params.maxPrice) {
    list = list.filter((p) => p.price <= params.maxPrice!);
  }
  if (params.part_number) {
    const pn = params.part_number.toLowerCase();
    list = list.filter((p) => (p.part_number || "").toLowerCase().includes(pn));
  }
  if (params.car_fit) {
    const cf = params.car_fit.toLowerCase();
    list = list.filter((p) => {
      const hay = [p.car, p.title, ...(p.fits || [])].join(" ").toLowerCase();
      return hay.includes(cf);
    });
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    list = list.filter((p) => {
      const hay = [
        p.title,
        p.car,
        p.location,
        p.part_number || "",
        ...(p.fits || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }
  if (params.sort === "price_asc") list.sort((a, b) => a.price - b.price);
  if (params.sort === "price_desc") list.sort((a, b) => b.price - a.price);
  return list.map((p) => enrichPartImages(p));
}

function filterMasters(
  params: { q?: string; lat?: number; lng?: number; radius_km?: number } = {}
): Master[] {
  let list = MOCK_MASTERS.map((m) => ({ ...m }));

  if (params.q) {
    const q = params.q.toLowerCase();
    list = list.filter(
      (m) => m.name.toLowerCase().includes(q) || m.spec.toLowerCase().includes(q)
    );
  }

  if (params.lat != null && params.lng != null) {
    const radius = params.radius_km ?? 25;
    list = list
      .map((m) => {
        if (m.latitude == null || m.longitude == null) return { ...m, distance_km: null };
        const dist = Math.round(haversineKm(params.lat!, params.lng!, m.latitude, m.longitude) * 10) / 10;
        return { ...m, distance_km: dist };
      })
      .filter((m) => m.distance_km == null || m.distance_km <= radius)
      .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
  }

  return list;
}

export const mockApi = {
  health: async () => {
    await delay();
    return { status: "ok", service: "ftservice-demo" };
  },
  getConfig: async () => {
    await delay(120);
    return MOCK_CONFIG;
  },
  me: async () => {
    await delay(120);
    const u = await storage.getUser();
    return u || MOCK_USER;
  },
  getCategories: async () => {
    await delay(120);
    return MOCK_CATEGORIES;
  },
  getParts: async (params = {}) => {
    await delay();
    return filterParts(params);
  },
  getPart: async (id: number) => {
    await delay();
    const p = MOCK_PARTS.find((x) => x.id === id);
    if (!p) throw new Error("Объявление не найдено");
    return enrichPartImages(p);
  },
  getMasters: async (params = {}) => {
    await delay();
    return filterMasters(params);
  },
  getNearbyMasters: async (lat: number, lng: number, radius_km = 15) => {
    await delay(400);
    return filterMasters({ lat, lng, radius_km });
  },
  login: async (email: string, _password: string) => {
    await delay(500);
    const user: User = {
      ...MOCK_USER,
      email: email.trim() || MOCK_USER.email,
      full_name: email.includes("@") ? email.split("@")[0] : "Покупатель",
    };
    const token = "demo-token-ftservice";
    await storage.setAuth(token, user);
    return { access_token: token, user, token_type: "bearer" };
  },
  register: async (payload: {
    email: string;
    full_name: string;
    phone?: string;
    role: string;
  }) => {
    await delay(500);
    const user: User = {
      id: 99,
      email: payload.email,
      full_name: payload.full_name,
      phone: payload.phone || null,
      role: payload.role as User["role"],
    };
    const token = "demo-token-ftservice";
    await storage.setAuth(token, user);
    const message =
      payload.role === "master"
        ? "Профиль мастера отправлен на проверку."
        : payload.role === "seller"
          ? "Аккаунт продавца создан."
          : undefined;
    return { access_token: token, user, message };
  },
  submitPart: async () => {
    await delay(600);
    return { ok: true };
  },
  createBooking: async (_payload: BookingPayload) => {
    await delay(600);
    return { ok: true, id: Date.now() };
  },
  getCabinet: async () => {
    await delay();
    return MOCK_CABINET;
  },
  logout: async () => {
    await storage.clear();
  },
};
