# Статус бэкенда FTservice — продакшен

## Реализовано

| Модуль | Эндпоинты |
|--------|-----------|
| Health / Config | `GET /api/health`, `GET /api/config` |
| Auth | `POST /register`, `POST /login`, `GET /me`, `POST /logout` |
| Каталог | `GET /parts/categories`, `GET /parts` (пагинация), `GET /parts/{id}` |
| Заявки | `POST /parts/submissions` (+ `image_urls`, привязка `user_id`) |
| Мастера | `GET /masters` (пагинация), `GET /masters/nearby`, `GET /masters/{id}` |
| Записи | `POST /bookings`, `GET /bookings/cabinet` |
| **Медиа** | `POST /api/uploads/images`, раздача `GET /api/media/{file}` |
| **Избранное** | `POST /me/favorites/parts/{id}`, masters, `GET /me/library` |
| **Просмотры** | `POST /me/viewed/parts/{id}`, `DELETE /me/viewed/parts` |
| **Поиски** | `GET/POST/DELETE /me/saved-searches` |
| **Продавец** | `GET /seller/dashboard`, `/submissions`, `/parts` |
| Админка | submissions, users, parts, masters, stats |

## Инфраструктура

- SQLite (dev) / PostgreSQL (`DATABASE_URL` + `psycopg2-binary`)
- Миграции: `migrate.py` + **Alembic** (`alembic upgrade head`)
- Docker Compose
- Тесты: `pytest tests/ -q` (15+ проверок)

## Вне scope API (как в маркетплейсах через мессенджеры)

- In-app чат (используются WhatsApp/Telegram из config)
- Push-уведомления (FCM — отдельный сервис)
- Платежи онлайн

## Деплой

```bash
cp .env.example .env
# SECRET_KEY, DATABASE_URL, PUBLIC_BASE_URL=https://api.domain.kg
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Nginx: прокси на :8000, `client_max_body_size 10M;`, статика `/api/media/` или весь `/api`.
