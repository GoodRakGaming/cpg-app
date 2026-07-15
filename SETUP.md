# Запуск проекта — инструкция

## Требования

- **Node.js** v18 или выше — https://nodejs.org
- **PostgreSQL** 14 или выше — https://www.postgresql.org/download/
- **Git** (опционально)

На Linux/WSL2 также нужны системные библиотеки для Puppeteer (PDF-генератор):
```bash
sudo apt-get install -y libnspr4 libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 \
  libcups2t64 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 \
  libgbm1 libpango-1.0-0 libcairo2 libasound2t64 libxshmfence1
```

---

## Шаг 1 — База данных

Создай базу данных в PostgreSQL:
```sql
CREATE DATABASE proposal_generator;
```

Или через командную строку:
```bash
psql -U postgres -c "CREATE DATABASE proposal_generator;"
```

---

## Шаг 2 — Переменные окружения

Файлы `.env` уже включены в архив с настройками для локальной разработки.

**backend/.env** — при необходимости измени:
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=proposal_generator
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres   ← поменяй если у тебя другой пароль
```

**frontend/.env.local** — менять не нужно если запускаешь локально.

---

## Шаг 3 — Установка зависимостей

```bash
# Backend
cd backend
npm install

# Frontend (в отдельном терминале)
cd frontend
npm install
```

---

## Шаг 4 — Браузер для PDF (Puppeteer)

После `npm install` в папке backend выполни:
```bash
cd backend
npx puppeteer browsers install chrome
```

Это скачает Chrome (~150 МБ) в папку `~/.cache/puppeteer/`. Нужно только один раз.

---

## Шаг 5 — Запуск

**Backend** (порт 3000):
```bash
cd backend
npm start
```

При первом запуске backend автоматически создаст таблицы в базе данных.

**Frontend** (порт 3001, в отдельном терминале):
```bash
cd frontend
npm run dev
```

Открой в браузере: http://localhost:3001

---

## Частые проблемы

| Проблема | Решение |
|----------|---------|
| `password authentication failed for user "postgres"` | Проверь пароль в `backend/.env` |
| `connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL не запущен — запусти сервис |
| `PDF service initialization failed` | Не установлен Chrome — выполни Шаг 4 |
| `EADDRINUSE :::3000` | Порт занят — останови другой процесс или смени `PORT` в `.env` |
| Пустая страница в браузере | Убедись что backend запущен и доступен на порту 3000 |

---

## Структура проекта

```
commercial_proposal_generator/
├── backend/          # Node.js + Express API (порт 3000)
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── models/   # Sequelize модели (PostgreSQL)
│   │   └── services/ # PDF генерация (Puppeteer)
│   └── .env          # Конфигурация
├── frontend/         # Next.js приложение (порт 3001)
│   ├── app/          # Страницы (App Router)
│   ├── lib/api.ts    # API клиент
│   └── .env.local    # Конфигурация
└── SETUP.md          # Этот файл
```
