"""Категории каталога — единый список для API и сида."""

CATEGORIES = [
    {"id": "engine", "name": "Двигатель", "abbr": "ДВ"},
    {"id": "electrical", "name": "Электрика", "abbr": "ЭЛ"},
    {"id": "general", "name": "Все автозапчасти", "abbr": "АЗ"},
    {"id": "suspension", "name": "Подвеска", "abbr": "ПД"},
    {"id": "cooling", "name": "Охлаждение", "abbr": "ОХ"},
    {"id": "transmission", "name": "КПП", "abbr": "КП"},
    {"id": "interior", "name": "Салон", "abbr": "СА"},
    {"id": "wheels_tires", "name": "Диски и шины", "abbr": "ДШ"},
    {"id": "fluids", "name": "Масло и жидкость", "abbr": "МЖ"},
]

# Старые id → новые (для миграции БД и фильтрации)
CATEGORY_REMAP: dict[str, str] = {
    "body": "general",
    "brakes": "general",
    "wheels": "wheels_tires",
    "tires": "wheels_tires",
}

# Фильтр по категории включает legacy-записи до миграции
CATEGORY_FILTER_GROUPS: dict[str, list[str]] = {
    "general": ["general", "body", "brakes"],
    "wheels_tires": ["wheels_tires", "wheels", "tires"],
}


def category_ids_for_filter(category_id: str) -> list[str]:
    return CATEGORY_FILTER_GROUPS.get(category_id, [category_id])


def category_name(category_id: str) -> str:
    for cat in CATEGORIES:
        if cat["id"] == category_id:
            return cat["name"]
    legacy_names = {
        "body": "Все автозапчасти",
        "brakes": "Все автозапчасти",
        "wheels": "Диски и шины",
        "tires": "Диски и шины",
    }
    return legacy_names.get(category_id, category_id)
