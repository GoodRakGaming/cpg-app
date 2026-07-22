# 🏗️ Архитектура и API

**Commercial Proposal Generator** — веб-приложение для создания коммерческих предложений (КП) из
шаблонов, с версионированием и экспортом в PDF. Развёрнуто на `cp.profstroi74.ru`.

Для истории развития проекта и текущего статуса см. [STATUS.md](STATUS.md). Для инфраструктуры и
деплоя — [DEPLOYMENT.md](DEPLOYMENT.md). Для активных дизайн-задач — [PLANNING/](PLANNING/).

---

## Модель данных и доступа

- **Шаблоны** и **предложения (КП)** — общий ресурс для всех аутентифицированных пользователей
  (любой сотрудник видит/редактирует/удаляет любой шаблон и любое КП). `created_by`/`user_id`
  сохраняются только для атрибуции, не для ограничения доступа.
- **Пользователи**: два уровня доступа — `user` (сотрудник) и `admin`. Публичной регистрации нет —
  аккаунты создаёт администратор со страницы «Пользователи» (`/dashboard/users`).
- **Версионирование**: каждое изменение КП с реальным дифом создаёт новую `ProposalVersion`;
  `Proposal.current_version_id` указывает на активную. Restore переключает указатель на старую
  версию, не создавая дубликат.

### Таблицы (PostgreSQL, `backend/migrations/001_initial_schema.sql`)

| Таблица | Ключевые поля |
|---|---|
| `users` | email (unique), password_hash, first_name, last_name, `role` (user/admin), `is_active` |
| `templates` | name, description, version, `data` (JSONB), created_by → users.id |
| `proposals` | title, status (draft/final/archived), template_id, user_id, current_version_id |
| `proposal_versions` | proposal_id, version_number, `data` (JSONB), comment, changed_by, pdf_hash |

---

## Backend

**Стек:** Node.js, Express 4, Sequelize 6 (ORM), PostgreSQL, JWT (`jsonwebtoken`), Joi (валидация),
bcryptjs (хеширование паролей), Puppeteer (PDF), `express-rate-limit`.

- **Аутентификация**: JWT access-токен (15 мин) + refresh-токен (7 дней), полностью **stateless**
  (нет таблицы сессий, нет отзыва конкретного токена). `authenticateToken`
  (`backend/src/middleware/auth.js`) на каждый запрос подгружает свежие `role`/`is_active` из БД —
  это единственный способ мгновенно отозвать доступ у деактивированного пользователя.
- **Роуты**: `backend/src/routes/{auth,users,templates,proposals,pdf}.js`, бизнес-логика в
  `backend/src/services/`.
- **PDF**: `backend/src/services/pdfService.js` — Puppeteer рендерит серверный HTML (design-токены
  в OKLCH, те же что и в веб-интерфейсе) в PDF; изображения (лого/подпись/печать) встраиваются как
  base64 напрямую в `Template.data`, отдельного файлового хранилища нет.

## Frontend

**Стек:** Next.js (App Router), React 19, TypeScript, Tailwind CSS 4 (CSS-first `@theme inline`,
без `tailwind.config.js`).

- Дизайн-токены и UI-примитивы (`Button`, `Badge`, `Input`, `Card`, `Pagination`, `FilterChips`) —
  общие для всех экранов, см. `frontend/components/ui/`.
- `NavRail` (`frontend/components/layout/NavRail.tsx`) — закреплённый вертикальный сайдбар;
  пункт «Пользователи» виден только `role: admin`.
- `frontend/lib/api.ts` — единый API-клиент с автоматическим retry через refresh-токен на 401.

---

## API Reference

Base URL: `/api`. Все endpoints кроме `POST /auth/login` требуют `Authorization: Bearer <token>`.

### Auth

| Endpoint | Метод | Доступ | Описание |
|---|---|---|---|
| `/auth/login` | POST | публичный (rate-limited: 10/15мин на IP) | Вход, возвращает access+refresh токены |
| `/auth/logout` | POST | auth | Очистка refresh-cookie |
| `/auth/refresh` | POST | auth (refresh-токен) | Новый access-токен |
| `/auth/change-password` | POST | auth | Смена собственного пароля (`current_password`, `new_password`) |

Публичной регистрации нет (закрыта 2026-07-22 — см. STATUS.md).

### Users (admin-only)

| Endpoint | Метод | Описание |
|---|---|---|
| `/users` | GET | Список (`?limit&offset&search`) |
| `/users` | POST | Создать (`email`, `role?`, `password?` — если не указан, генерируется сервером и возвращается один раз) |
| `/users/:id` | PATCH | `is_active?`/`role?` — блокирует удаление последнего активного админа |
| `/users/:id/reset-password` | POST | Новый временный пароль (не завершает открытые сессии — токены stateless) |

### Templates

| Endpoint | Метод | Описание |
|---|---|---|
| `/templates` | GET | Список (`?limit&offset&search`), общий для всех пользователей |
| `/templates` | POST | Создать |
| `/templates/:id` | GET / PUT / DELETE | Получить / обновить / soft-delete |

### Proposals

| Endpoint | Метод | Описание |
|---|---|---|
| `/proposals` | GET | Список (`?limit&offset&search&status`), общий для всех пользователей |
| `/proposals` | POST | Создать из шаблона |
| `/proposals/:id` | GET / PUT / DELETE | Получить / обновить (создаёт новую версию при реальном дифе) / soft-delete |
| `/proposals/:id/versions` | GET | История версий |
| `/proposals/:id/versions/:version_id` | GET | Конкретная версия |
| `/proposals/:id/versions/:version_id/restore` | POST | Откат (переключает указатель, не дублирует) |

### PDF

| Endpoint | Метод | Описание |
|---|---|---|
| `/pdf/preview/:proposalId` | GET | HTML для live-превью (без Puppeteer) |
| `/pdf/:proposalId` | GET | Скачать PDF |
| `/pdf/generate/:proposalId` | POST | Сгенерировать/пересчитать PDF-хэш |
| `/pdf/export/:proposalId` | POST | Экспорт с кастомными опциями (формат, поля) |
| `/pdf/status/:proposalId` | GET | Статус кэша PDF |

### Общий формат ответа

```json
{ "success": true, "data": { "...": "..." }, "message": "..." }
```
```json
{ "success": false, "error": { "status": 400, "message": "..." } }
```
