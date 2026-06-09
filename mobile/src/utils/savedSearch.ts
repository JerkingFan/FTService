import { storage } from "../storage";
import { getCategory } from "./format";

export type SearchSnapshot = {
  q?: string;
  category?: string;
  part_number?: string;
  car_fit?: string;
};

export function buildSearchLabel(snapshot: SearchSnapshot): string | null {
  const q = snapshot.q?.trim();
  const oem = snapshot.part_number?.trim();
  const carFit = snapshot.car_fit?.trim();
  const category =
    snapshot.category && snapshot.category !== "all" ? getCategory(snapshot.category).name : "";

  const label = q || oem || carFit || category;
  return label || null;
}

/** Автосохранение поиска после запроса (без алерта). */
export async function rememberSearch(snapshot: SearchSnapshot): Promise<void> {
  const label = buildSearchLabel(snapshot);
  if (!label) return;

  try {
    await storage.addSavedSearch({
      label,
      q: snapshot.q?.trim() || undefined,
      category:
        snapshot.category && snapshot.category !== "all" ? snapshot.category : undefined,
      part_number: snapshot.part_number?.trim() || undefined,
      car_fit: snapshot.car_fit?.trim() || undefined,
    });
  } catch {
    /* ignore */
  }
}

export function describeSearch(s: {
  q?: string;
  category?: string;
  part_number?: string;
  car_fit?: string;
}): string {
  const parts: string[] = [];
  if (s.q?.trim()) parts.push(s.q.trim());
  if (s.part_number?.trim()) parts.push(`OEM ${s.part_number.trim()}`);
  if (s.car_fit?.trim()) parts.push(s.car_fit.trim());
  if (s.category && s.category !== "all") parts.push(getCategory(s.category).name);
  return parts.join(" · ") || "Поиск";
}
