const API_BASE = "http://213.155.9.130/api";
const STORAGE_TOKEN = "ftservice_token";
const STORAGE_USER = "ftservice_user";

function getToken() {
  return localStorage.getItem(STORAGE_TOKEN) || localStorage.getItem("bazardrom_token");
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER) || localStorage.getItem("bazardrom_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setAuth(token, user) {
  if (token) {
    localStorage.setItem(STORAGE_TOKEN, token);
    localStorage.removeItem("bazardrom_token");
  }
  if (user) {
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    localStorage.removeItem("bazardrom_user");
  }
}

function clearAuth() {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
  localStorage.removeItem("bazardrom_token");
  localStorage.removeItem("bazardrom_user");
}

function parseApiError(err) {
  if (!err) return "Ошибка запроса";
  if (typeof err === "string") return err;
  if (Array.isArray(err)) {
    return err.map((e) => e.msg || e.message || JSON.stringify(e)).join(". ");
  }
  if (typeof err === "object" && err.msg) return err.msg;
  return String(err);
}

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = parseApiError(body.detail) || msg;
    } catch (_) {}
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
}

const api = {
  async health() {
    return apiFetch("/health");
  },

  async getConfig() {
    return apiFetch("/config");
  },

  async me() {
    return apiFetch("/auth/me");
  },

  async getCategories() {
    return apiFetch("/parts/categories");
  },

  async getParts(params = {}) {
    const q = new URLSearchParams();
    if (params.q) q.set("q", params.q);
    if (params.part_number) q.set("part_number", params.part_number);
    if (params.car_fit) q.set("car_fit", params.car_fit);
    if (params.category && params.category !== "all") q.set("category", params.category);
    if (params.condition && params.condition !== "all") q.set("condition", params.condition);
    if (params.minPrice) q.set("min_price", params.minPrice);
    if (params.maxPrice) q.set("max_price", params.maxPrice);
    if (params.location) q.set("location", params.location);
    if (params.verifiedOnly) q.set("verified_only", "1");
    if (params.sort) q.set("sort", params.sort);
    q.set("page", String(params.page || 1));
    q.set("limit", String(params.limit || 50));
    const qs = q.toString();
    const data = await apiFetch(`/parts?${qs}`);
    return data.items || data;
  },

  async getPart(id) {
    return apiFetch(`/parts/${id}`);
  },

  async getMasters(params = {}) {
    const q = new URLSearchParams();
    if (params.q) q.set("q", params.q);
    if (params.lat != null) q.set("lat", params.lat);
    if (params.lng != null) q.set("lng", params.lng);
    if (params.radius_km) q.set("radius_km", params.radius_km);
    q.set("page", String(params.page || 1));
    q.set("limit", String(params.limit || 50));
    const qs = q.toString();
    const data = await apiFetch(`/masters?${qs}`);
    return data.items || data;
  },

  async getLibrary() {
    return apiFetch("/me/library");
  },

  async toggleFavoritePart(id) {
    return apiFetch(`/me/favorites/parts/${id}`, { method: "POST" });
  },

  async uploadImages(formData) {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/uploads/images`, { method: "POST", headers, body: formData });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },

  async getSellerDashboard() {
    return apiFetch("/seller/dashboard");
  },

  async getNearbyMasters(lat, lng, radius_km = 15) {
    return apiFetch(`/masters/nearby?lat=${lat}&lng=${lng}&radius_km=${radius_km}`);
  },

  async createBooking(data) {
    return apiFetch("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getCabinet() {
    return apiFetch("/bookings/cabinet");
  },

  async getMasterCabinet() {
    return apiFetch("/bookings/master");
  },

  async updateBookingStatus(bookingId, status) {
    return apiFetch(`/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async login(email, password) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    setAuth(data.access_token, data.user);
    return data;
  },

  async register(payload) {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: payload.email.trim(),
        password: payload.password,
        full_name: payload.full_name.trim(),
        phone: payload.phone?.trim() || null,
        role: payload.role || "buyer",
        district: payload.district?.trim() || null,
        spec: payload.spec?.trim() || null,
      }),
    });
    setAuth(data.access_token, data.user);
    return data;
  },

  async submitPart(payload) {
    const body = { ...payload };
    if (typeof body.fits === "string") {
      body.fits = body.fits
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return apiFetch("/parts/submissions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async getPendingSubmissions() {
    return apiFetch("/admin/submissions");
  },

  async approveSubmission(id) {
    return apiFetch(`/admin/submissions/${id}/approve`, { method: "POST" });
  },

  async rejectSubmission(id) {
    return apiFetch(`/admin/submissions/${id}/reject`, { method: "POST" });
  },

  async updateSubmission(id, payload) {
    return apiFetch(`/admin/submissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async createPart(payload) {
    return apiFetch("/parts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getAdminStats() {
    return apiFetch("/admin/stats");
  },

  async getAdminUsers() {
    return apiFetch("/admin/users");
  },

  async updateAdminUser(id, payload) {
    return apiFetch(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async getAdminParts(status = "all") {
    const q = status && status !== "all" ? `?status=${status}` : "";
    return apiFetch(`/admin/parts${q}`);
  },

  async updateAdminPart(id, payload) {
    return apiFetch(`/admin/parts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async archiveAdminPart(id) {
    return apiFetch(`/admin/parts/${id}/archive`, { method: "POST" });
  },

  async publishAdminPart(id) {
    return apiFetch(`/admin/parts/${id}/publish`, { method: "POST" });
  },

  async getAdminMasters() {
    return apiFetch("/admin/masters");
  },

  async createAdminMaster(payload) {
    return apiFetch("/admin/masters", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateAdminMaster(id, payload) {
    return apiFetch(`/admin/masters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};

function isStaffUser() {
  const u = getCurrentUser();
  return u && (u.role === "admin" || u.role === "moderator");
}

let apiOnline = null;

async function checkApi() {
  if (apiOnline !== null) return apiOnline;
  try {
    await api.health();
    apiOnline = true;
  } catch {
    apiOnline = false;
  }
  return apiOnline;
}

async function loadParts(params) {
  if (!(await checkApi())) return null;
  return api.getParts(params);
}

async function loadPart(id) {
  if (!(await checkApi())) return null;
  try {
    return await api.getPart(id);
  } catch {
    return null;
  }
}

async function loadMasters(params) {
  if (!(await checkApi())) return null;
  if (typeof params === "string") return api.getMasters({ q: params });
  return api.getMasters(params || {});
}

async function loadCategories() {
  if (!(await checkApi())) return null;
  try {
    return await api.getCategories();
  } catch {
    return null;
  }
}

async function loadConfig() {
  if (!(await checkApi())) return null;
  try {
    return await api.getConfig();
  } catch {
    return null;
  }
}
