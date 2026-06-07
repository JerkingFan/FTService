# FTservice API (боевой бэкенд)

FastAPI + SQLAlchemy. По умолчанию **SQLite** (файл `ftservice.db`). Для продакшена — **PostgreSQL** через `DATABASE_URL`.

## Быстрый старт (локально)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health: http://localhost:8000/api/health  
- Swagger: http://localhost:8000/docs  
- Конфиг для приложения: http://localhost:8000/api/config  

При первом запуске создаётся БД, ~**30 объявлений** с фото, 5 мастеров, тестовые пользователи.

## Docker

Из корня репозитория:

```bash
docker compose up --build
```

API на порту **8000**, данные в volume `ftservice_data`.

## Тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Админ | admin@ftservice.kg | admin123 |
| Модератор | mod@ftservice.kg | mod123 |
| Покупатель | buyer@test.kg | buyer123 |
| Продавец | seller@test.kg | seller123 |

## API для мобильного приложения

Базовый префикс: `/api`

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| GET | `/health` | — | Проверка сервера |
| GET | `/config` | — | WhatsApp, Telegram, город |
| POST | `/auth/register` | — | Регистрация (buyer/seller/master) |
| POST | `/auth/login` | — | Вход → JWT |
| GET | `/auth/me` | Bearer | Текущий пользователь |
| GET | `/parts/categories` | — | Категории (10 шт., шины/диски) |
| GET | `/parts` | — | Каталог (фильтры, пагинация `page`/`limit`) |
| POST | `/uploads/images` | Bearer | Загрузка фото объявления |
| GET | `/me/library` | Bearer | Избранное, просмотры, поиски |
| GET | `/seller/dashboard` | Bearer | Кабинет продавца |
| GET | `/parts/{id}` | — | Карточка (+ `images`, `attributes`) |
| POST | `/parts/submissions` | — | Заявка на публикацию |
| GET | `/masters` | — | Мастера (+ GPS фильтр) |
| GET | `/masters/nearby` | — | Ближайшие мастера |
| POST | `/bookings` | Bearer | Запись к мастеру |
| GET | `/bookings/cabinet` | Bearer | Кабинет (записи + история) |

### Параметры `GET /api/parts`

- `q` — поиск по тексту  
- `part_number` — артикул  
- `car_fit` — совместимость  
- `category` — id категории  
- `condition` — `used` \| `new`  
- `min_price`, `max_price`  
- `location` — район/рынок  
- `verified_only=1`  
- `sort` — `newest` \| `price_asc` \| `price_desc`  

## Модерация (веб-админка / Postman)

Токен модератора → `GET /api/admin/submissions`, `POST .../approve`, `POST .../reject`.

Админ: `GET /api/admin/stats`, управление пользователями, мастерами, архив объявлений.

## Продакшен

1. `SECRET_KEY` — длинная случайная строка  
2. `DATABASE_URL=postgresql+psycopg2://...`  
3. `PUBLIC_BASE_URL=https://api.your-domain.kg` (URL в ответе upload)  
4. `alembic upgrade head`  
5. HTTPS reverse proxy (nginx), `client_max_body_size 10M`  
6. В мобильном `app.json` → `apiUrl`: `https://your-domain.kg/api`  

## Тесты

```bash
pytest tests/ -q
```

## Переменные окружения

См. `.env.example`.
