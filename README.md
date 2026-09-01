# Commercial Proposal Generator

Веб-приложение для создания коммерческих предложений (КП) из шаблонов, с версионированием и
экспортом в PDF. Развёрнуто в закрытой инфраструктуре компании.

Документация — в `docs/`:

- **[docs/README.md](docs/README.md)** — навигация, запуск локально
- **[docs/STATUS.md](docs/STATUS.md)** — текущее состояние, changelog
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — стек, модель данных, справочник API

Инфраструктура и деплой, активные и будущие задачи — во внутренней документации, не в этом
репозитории.

## Быстрый старт

```bash
# Backend (порт 3000) — запускать первым, дать подняться, затем frontend
cd backend && npm install && npm run dev

# Frontend (порт 3001)
cd frontend && npm install && npm run dev
```

Backend требует PostgreSQL и `.env` (см. `backend/.env.example`). Миграции — `npm run migrate` в `backend/`.
