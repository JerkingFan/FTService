import { API_BASE } from "./config";
import { tokenStorage } from "./tokenStorage";

function parseError(detail: unknown): string {
  if (!detail) return "Ошибка запроса";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((e: { msg?: string }) => e.msg || String(e)).join(". ");
  }
  return String(detail);
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await tokenStorage.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = parseError(body.detail);
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};
