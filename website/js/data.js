const PARTS = [
  { id: 1, title: "Генератор Toyota Camry 40 2.4", part_number: "27060-0H010", price: 8500, condition: "used", category: "electrical", location: "рынок Кудайберген", seller: "Азамат К.", verified: true, car: "Toyota Camry", fits: ["Toyota Camry 40", "Lexus ES350"], phone: "+996555100101", working_hours: "09:00–18:00" },
  { id: 2, title: "Передний бампер Honda Accord 8", part_number: "71110-TA0-A00", price: 12000, condition: "used", category: "general", location: "Джал", seller: "Разбор «Авто+»", verified: true, car: "Honda Accord", fits: ["Honda Accord 8"] },
  { id: 3, title: "Двигатель 1NZ-FE 1.5 б/у", part_number: "1NZ-FE", price: 95000, condition: "used", category: "engine", location: "рынок Кудайберген", seller: "Эрлан М.", verified: true, car: "Toyota", fits: ["Toyota Vitz", "Toyota Yaris"] },
  { id: 4, title: "Тормозные колодки передние — новые", part_number: "04465-02220", price: 3200, condition: "new", category: "general", location: "Орто-Сай", seller: "Импорт KG", verified: true, car: "универсальные", fits: ["Toyota Corolla"] },
  { id: 5, title: "Фара левая Hyundai Solaris", part_number: "92101-4L000", price: 6500, condition: "used", category: "general", location: "рынок Кудайберген", seller: "Бакыт Т.", verified: true, car: "Hyundai Solaris", fits: ["Hyundai Solaris", "Hyundai Accent"] },
  { id: 6, title: "Стартер Nissan Almera Classic", part_number: "23300-EE00A", price: 4800, condition: "used", category: "electrical", location: "Асанбай", seller: "Нурбек А.", verified: true, car: "Nissan Almera" },
  { id: 7, title: "Радиатор охлаждения Mercedes W210", part_number: "2105000303", price: 15000, condition: "used", category: "cooling", location: "рынок Кудайберген", seller: "Разбор «Авто+»", verified: true, car: "Mercedes E-class" },
  { id: 8, title: "Амортизатор передний левый VW Polo", part_number: "6R0413031", price: 5500, condition: "used", category: "suspension", location: "Джал", seller: "Азамат К.", verified: true, car: "VW Polo" },
];

const MASTERS = [
  { id: 1, name: "Темирлан А.", spec: "Автоэлектрик", exp: "8 лет", rating: 4.9, jobs: 340, district: "Джал", priceFrom: 500, phone: "+996555501001", working_hours: "09:00–19:00", latitude: 42.8742, longitude: 74.5698 },
  { id: 2, name: "Данияр С.", spec: "Автоэлектрик", exp: "5 лет", rating: 4.8, jobs: 210, district: "Асанбай", priceFrom: 500, phone: "+996555501002", working_hours: "10:00–18:00", latitude: 42.8267, longitude: 74.6883 },
  { id: 3, name: "Канат Б.", spec: "Автоэлектрик", exp: "12 лет", rating: 5.0, jobs: 520, district: "рынок Кудайберген", priceFrom: 500, phone: "+996555501003", working_hours: "08:00–20:00", latitude: 42.8756, longitude: 74.5833 },
  { id: 4, name: "Айбек М.", spec: "Автоэлектрик", exp: "3 года", rating: 4.7, jobs: 95, district: "Орто-Сай", priceFrom: 500, latitude: 42.8361, longitude: 74.6114 },
  { id: 5, name: "Эрмек Т.", spec: "Автоэлектрик", exp: "6 лет", rating: 4.8, jobs: 180, district: "Молодая Гвардия", priceFrom: 500, latitude: 42.8578, longitude: 74.6042 },
];

const CATEGORIES = [
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

const LEGACY_CATEGORY_IDS = {
  body: "general",
  brakes: "general",
  wheels: "wheels_tires",
  tires: "wheels_tires",
};

const WHATSAPP = "996700000000";
const TELEGRAM = "ftservice_kg";

function formatPrice(n) {
  return n.toLocaleString("ru-RU") + " сом";
}

function getCategory(id) {
  const normalized = LEGACY_CATEGORY_IDS[id] || id;
  return CATEGORIES.find((x) => x.id === normalized) || { abbr: "—", name: "Прочее" };
}

function getInitials(name) {
  const parts = name.replace(/\./g, " ").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
