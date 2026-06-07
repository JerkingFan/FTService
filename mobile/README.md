# FTservice Mobile (Android APK)

Мобильное приложение маркетплейса б/у запчастей и мастеров.

## Режим API (по умолчанию — боевой)

Приложение ходит на **реальный бэкенд** (`backend/`). В `app.json`: `"demoMode": false`, `"apiUrl": "http://10.0.2.2:8000/api"` (эмулятор).

Перед сборкой APK укажите IP вашего сервера, например `"apiUrl": "http://192.168.1.50:8000/api"`.

Переменные окружения при сборке:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api EXPO_PUBLIC_DEMO_MODE=false npm run build:apk
```

## Демо без сервера (для презентации)

**Сервер не нужен.** В `app.json` поставьте `"demoMode": true` или:

```bash
EXPO_PUBLIC_DEMO_MODE=true npx expo start
```
- каталог запчастей, карточки, артикул, «подходит для»
- мастера, **GPS «ближайшие»** (реальная геолокация + расчёт расстояния по mock-координатам)
- вход, кабинет, подача объявления, запись — всё на тестовых данных

Переключение на боевой API: `"demoMode": false` + `"apiUrl": "http://IP:8000/api"` → пересобрать APK.

## Возможности

- Каталог запчастей с поиском по названию, **артикулу OEM**, совместимости с авто
- Карточка детали: «Подходит для», телефон, часы, WhatsApp / Telegram
- Мастера с **GPS** — кнопка «Ближайшие»
- Запись к мастеру
- Регистрация: покупатель / продавец / мастер
- Подача объявления (форма + мессенджеры)
- Личный кабинет: записи и история

## Требования

- Node.js 18+
- Запущенный бэкенд: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- [Expo Go](https://expo.dev/go) на телефоне (для теста) или Android Studio (для APK)

## API URL

По умолчанию в `app.json`:

| Среда | URL |
|--------|-----|
| Android-эмулятор | `http://10.0.2.2:8000/api` |
| iOS-симулятор | измените `extra.apiUrl` на `http://localhost:8000/api` |
| Реальный телефон | IP вашего ПК в Wi‑Fi, например `http://192.168.1.50:8000/api` |

Измените `expo.extra.apiUrl` в `app.json` перед сборкой APK.

## Быстрый старт

```bash
cd mobile
npm install
npx expo start
```

Отсканируйте QR в **Expo Go** (телефон и ПК в одной Wi‑Fi сети).

## Сборка APK (локально, без облака Expo)

Нужны: **Java 17**, **Android SDK** (на Mac: `brew install --cask android-commandlinetools`).

```bash
cd mobile
npm install
npx expo install expo-asset expo-font   # если ещё не ставили

export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools   # путь к SDK
export JAVA_HOME=/opt/homebrew/opt/openjdk@17

npx expo prebuild --platform android    # один раз
npm run build:apk
```

**Готовый APK:**
- `android/app/build/outputs/apk/release/app-release.apk`
- копия: `dist/FTservice-v1.0.0.apk` (~60 МБ)

Установка на телефон: скопируйте APK и откройте (разрешите «неизвестные источники»).

Пересборка после изменений JS:
```bash
npm run build:apk
```

Полная пересборка с нуля:
```bash
npm run build:apk:full
```

## Тестовые аккаунты

| Email | Пароль | Роль |
|-------|--------|------|
| buyer@test.kg | buyer123 | Покупатель |
| admin@ftservice.kg | admin123 | Админ |

## Структура

```
mobile/
  App.tsx              # Навигация (табы + стек)
  src/
    api.ts             # Клиент API
    config.ts          # URL бэкенда
    screens/           # Экраны
    components/        # Карточки, шапка
    context/           # Авторизация
```

## Устранение проблем

**«Network request failed»** — проверьте:
1. API запущен на `:8000`
2. В `app.json` указан правильный IP (не `localhost` на реальном устройстве)
3. Брандмауэр разрешает вход на порт 8000

**GPS** — при первом запуске разрешите доступ к геолокации.
