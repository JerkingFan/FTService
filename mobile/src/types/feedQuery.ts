import type { FilterValues } from "../components/FiltersModal";

export type PartsFeedQuery = {
  category?: string;
  q?: string;
  part_number?: string;
  filters?: FilterValues;
};

export function feedQueryKey(q: PartsFeedQuery): string {
  const f = q.filters;
  return JSON.stringify({
    category: q.category,
    q: q.q,
    part_number: q.part_number,
    condition: f?.condition,
    minPrice: f?.minPrice,
    maxPrice: f?.maxPrice,
    location: f?.location,
    verifiedOnly: f?.verifiedOnly,
  });
}

export function toApiParams(q: PartsFeedQuery) {
  const f = q.filters;
  return {
    q: q.q,
    part_number: q.part_number,
    category: q.category && q.category !== "all" ? q.category : undefined,
    condition: f?.condition && f.condition !== "all" ? f.condition : undefined,
    minPrice: f?.minPrice ? Number(f.minPrice) : undefined,
    maxPrice: f?.maxPrice ? Number(f.maxPrice) : undefined,
    location: f?.location || undefined,
    verifiedOnly: f?.verifiedOnly || undefined,
  };
}
