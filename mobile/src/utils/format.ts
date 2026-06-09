export function formatPrice(n: number): string {
  return `${n.toLocaleString("ru-RU")} сом`;
}

export function conditionLabel(c: "used" | "new"): string {
  return c === "new" ? "Новая" : "Б/У";
}

export const CATEGORIES = [
  { id: "all", name: "Все", abbr: "••" },
  { id: "engine", name: "Двигатель", abbr: "ДВ" },
  { id: "electrical", name: "Электрика", abbr: "ЭЛ" },
  { id: "general", name: "Все автозапчасти", abbr: "АЗ" },
  { id: "suspension", name: "Подвеска", abbr: "ПД" },
  { id: "cooling", name: "Охлаждение", abbr: "ОХ" },
  { id: "transmission", name: "КПП", abbr: "КП" },
  { id: "interior", name: "Салон", abbr: "СА" },
  { id: "wheels_tires", name: "Диски и шины", abbr: "ДШ" },
  { id: "fluids", name: "Масло и жидкость", abbr: "МЖ" },
];

const LEGACY_CATEGORY_IDS: Record<string, string> = {
  body: "general",
  brakes: "general",
  wheels: "wheels_tires",
  tires: "wheels_tires",
};

export function getCategory(id: string) {
  const normalized = LEGACY_CATEGORY_IDS[id] || id;
  return CATEGORIES.find((c) => c.id === normalized) || { id, name: "Прочее", abbr: "—" };
}

export const CATEGORY_NAMES: Record<string, string> = {
  engine: "Двигатель",
  electrical: "Электрика",
  general: "Все автозапчасти",
  suspension: "Подвеска",
  cooling: "Охлаждение",
  transmission: "КПП",
  interior: "Салон",
  wheels_tires: "Диски и шины",
  fluids: "Масло и жидкость",
  body: "Все автозапчасти",
  brakes: "Все автозапчасти",
  wheels: "Диски и шины",
  tires: "Диски и шины",
};
