# Commercial Proposal Generator

Веб-приложение для создания коммерческих предложений (КП) из шаблонов, с версионированием и
экспортом в PDF. Развёрнуто на **https://cp.profstroi74.ru**.

Документация — в `docs/`:

- **[docs/README.md](docs/README.md)** — навигация, запуск локально
- **[docs/STATUS.md](docs/STATUS.md)** — текущее состояние, changelog
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — стек, модель данных, справочник API
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — инфраструктура, деплой
- **[docs/PLANNING/](docs/PLANNING/)** — активные и будущие задачи

## Быстрый старт

```bash
# Backend (порт 3000) — запускать первым, дать подняться, затем frontend
cd backend && npm install && npm run dev

# Frontend (порт 3001)
cd frontend && npm install && npm run dev
```

Backend требует PostgreSQL и `.env` (см. `backend/.env.example`). Миграции — `npm run migrate` в `backend/`.
