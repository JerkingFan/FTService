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
  { id: "body", name: "Кузов", abbr: "КУ" },
  { id: "brakes", name: "Тормоза", abbr: "ТР" },
  { id: "suspension", name: "Подвеска", abbr: "ПД" },
  { id: "cooling", name: "Охлаждение", abbr: "ОХ" },
  { id: "transmission", name: "КПП", abbr: "КП" },
  { id: "wheels", name: "Диски", abbr: "ДК" },
  { id: "tires", name: "Шины", abbr: "ШН" },
  { id: "interior", name: "Салон", abbr: "СА" },
];

export function getCategory(id: string) {
  return CATEGORIES.find((c) => c.id === id) || { id, name: "Прочее", abbr: "—" };
}

export const CATEGORY_NAMES: Record<string, string> = {
  engine: "Двигатель",
  electrical: "Электрика",
  body: "Кузов",
  brakes: "Тормоза",
  suspension: "Подвеска",
  cooling: "Охлаждение",
  transmission: "КПП",
  interior: "Салон",
  wheels: "Диски",
  tires: "Шины",
};
