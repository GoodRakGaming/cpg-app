# 📝 Commercial Proposal Generator — Документация

Веб-приложение для создания коммерческих предложений (КП) из шаблонов, с версионированием и
экспортом в PDF. Развёрнуто на **https://cp.profstroi74.ru**.

## Документы

| Документ | Зачем |
|---|---|
| **[STATUS.md](STATUS.md)** | Текущее состояние проекта, changelog основных вех |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Стек, модель данных, справочник API |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Инфраструктура (Proxmox/LXC), push-to-deploy, известные вопросы |
| **[PLANNING/](PLANNING/)** | Активные и будущие задачи (дизайн-сессии, следующие фазы) |

## Запуск локально

```bash
# Backend (порт 3000) — запускать первым, дать подняться, затем frontend
cd backend && npm install && npm run dev

# Frontend (порт 3001)
cd frontend && npm install && npm run dev
```

Backend требует PostgreSQL и `.env` (см. `backend/.env.example`). Миграции — `npm run migrate` в `backend/`.

## Практика этого проекта

- Публичной регистрации нет — тестовых пользователей создавайте напрямую через Sequelize/SQL
  или через `/dashboard/users` (нужен уже существующий admin-аккаунт).
- Деплой — `git push production main` (см. [DEPLOYMENT.md](DEPLOYMENT.md)); GitHub — просто бэкап,
  не участвует в деплое.
