# FTservice — маркетплейс автозапчастей (Бишкек)

| Часть | Папка | Описание |
|-------|--------|----------|
| **API** | `backend/` | FastAPI, SQLite/PostgreSQL, JWT, модерация |
| **Мобильное** | `mobile/` | Expo / React Native, Android APK |
| **Сайт** | `website/` | Статический фронт + та же API |

## Режимы мобильного приложения

| Режим | Настройка | Данные |
|--------|-----------|--------|
| Демо (без сервера) | `EXPO_PUBLIC_DEMO_MODE=true` или `demoMode: true` в `app.json` | Mock в приложении |
| **Боевой** (по умолчанию) | `demoMode: false` + `apiUrl` на ваш сервер | API `backend/` |

### Подключение телефона к API на ПК

1. Запустите бэкенд: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000`
2. Узнайте IP ПК в Wi‑Fi (например `192.168.1.50`)
3. В `mobile/app.json` → `extra.apiUrl`: `http://192.168.1.50:8000/api`
4. Пересоберите APK или `npx expo start`

Эмулятор Android: `http://10.0.2.2:8000/api` (уже в `app.json`).

## Запуск всего стека

```bash
# API
cd backend && source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000

# Сайт (опционально)
cd website && python3 -m http.server 8080
```

Или: `docker compose up --build` из корня.

Подробнее: [backend/README.md](backend/README.md), [mobile/README.md](mobile/README.md).
