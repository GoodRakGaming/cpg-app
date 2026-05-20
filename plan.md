# План проекта: Генератор коммерческих предложений

## Определённые требования
- **Цель**: PDF-генератор коммерческих предложений (КП)
- **Масштаб**: Личный инструмент (1-2 пользователя)
- **Основные функции**:
  - ✓ Создание КП с шаблонами
  - ✓ Автоматический расчёт цен
  - ✓ Сохранение и управление шаблонами
  - ✓ История и версионирование КП
- **Tech Stack**:
  - Frontend: React (Next.js)
  - Backend: Node.js ИЛИ Python (нужна рекомендация)
  - Database: PostgreSQL (облако)
  - PDF Export: Любая рабочая библиотека
- **Особенности**:
  - Редактирование шаблонов в UI
  - Ручной ввод цен (без интеграции 1С)
  - Полная история версий с комментариями
  - Развёртывание: собственный сервер
  - Парсинг PDF: не требуется (только ручной ввод)

## Статус текущего кода
- HTML-прототип с Claude AI интеграцией ✓
- Базовый UI для редактирования КП ✓
- Проблемы: нет backend, нет БД, нет аутентификации, API ключи не безопасны

## Исследование завершено ✓
- **Backend рекомендация**: Node.js + Express + Puppeteer (PDF-генерация)
- **Архитектура**: JSON-шаблоны с placeholder'ами
- **Версионирование**: Снимки документов в JSONB (PostgreSQL)
- **Аутентификация**: JWT + refresh tokens в httpOnly cookies

## ИТОГОВЫЙ ПЛАН: 7 ФАЗ РЕАЛИЗАЦИИ

### ФАЗА 1: Backend Foundation (Express + PostgreSQL)
**Зависимость**: нет
**Файлы**:
- `backend/package.json` — зависимости
- `backend/src/server.js` — точка входа
- `backend/src/config/database.js` — PostgreSQL подключение
- `backend/src/middleware/errorHandler.js` — обработка ошибок

**Задачи**:
1. Инициализировать Node.js проект с Express
2. Настроить подключение к PostgreSQL (Sequelize или Knex)
3. Настроить основную структуру Express app
4. Создать базовый обработчик ошибок

### ФАЗА 2: Database Schema & Auth
**Зависимость**: Фаза 1 ✓
**Файлы**:
- `backend/migrations/001_initial_schema.sql` — создание таблиц
- `backend/src/models/User.js`, `Proposal.js`, `ProposalVersion.js`, `Template.js`
- `backend/src/routes/auth.js` — регистрация, логин, refresh
- `backend/src/middleware/auth.js` — JWT верификация

**Таблицы**:
- `users` (id, email, password_hash, created_at)
- `templates` (id, name, version, data JSONB, created_by, created_at, is_active)
- `proposals` (id, title, status, template_id, user_id, current_version_id, created_at, updated_at)
- `proposal_versions` (id, proposal_id, version_number, data JSONB, comment, changed_by, pdf_hash, created_at)

### ФАЗА 3: Template Management API
**Зависимость**: Фаза 2 ✓
**Файлы**:
- `backend/src/routes/templates.js` — CRUD
- `backend/src/services/templateService.js` — бизнес-логика

**Endpoints**:
- POST /api/templates — создать
- GET /api/templates — список активных
- PUT /api/templates/:id — обновить
- DELETE /api/templates/:id — удалить
- GET /api/templates/versions/:id — история версий

### ФАЗА 4: Proposal CRUD API
**Зависимость**: Фаза 3 ✓
**Файлы**:
- `backend/src/routes/proposals.js` — CRUD
- `backend/src/services/proposalService.js`

**Endpoints**:
- POST /api/proposals — создать (с template_id, data)
- GET /api/proposals — мои КП
- PUT /api/proposals/:id — обновить (автосохранение версий)
- GET /api/proposals/:id — получить
- GET /api/proposals/:id/versions — история версий
- POST /api/proposals/:id/versions/:versionId/restore — восстановить версию

### ФАЗА 5: PDF Generation Engine
**Зависимость**: Фаза 4 ✓
**Файлы**:
- `backend/src/services/pdfService.js` — Puppeteer интеграция
- `backend/src/templates/htmlRenderer.js` — преобразование данных в HTML

**Технология**: Puppeteer
**Логика**: 
1. Взять данные proposal + template
2. Рендерить HTML с замещением placeholders
3. Puppeteer → PDF
4. Сохранить pdf_hash для кэша

### ФАЗА 6: PDF Export Endpoint
**Зависимость**: Фаза 5 ✓
**Файлы**:
- `backend/src/routes/proposals.js` (добавить метод)

**Endpoint**:
- GET /api/proposals/:id/pdf — экспортировать в PDF (с кэшем по pdf_hash)

### ФАЗА 7: Frontend (React + Next.js)
**Зависимость**: Фаза 6 ✓ (но может вестись параллельно)
**Файлы**:
- `frontend/pages/login.tsx`
- `frontend/pages/proposals/index.tsx`
- `frontend/pages/proposals/[id].tsx` — редактор
- `frontend/pages/templates/index.tsx` — управление шаблонами
- `frontend/components/ProposalEditor.tsx`
- `frontend/components/TemplateEditor.tsx`
- `frontend/lib/api.ts` — API клиент
- `frontend/lib/auth.ts` — JWT management

### ФАЗА 8: Deployment (Docker)
**Файлы**:
- `Dockerfile` (backend)
- `docker-compose.yml`
- `.env.example`

---

## РЕШЕНИЯ И ИСКЛЮЧЕНИЯ

**Включено**:
✓ Полная версионная история с комментариями
✓ Редактирование шаблонов в админ-панели
✓ Автосохранение версий каждые N минут
✓ JWT-аутентификация

**Исключено**:
✗ AI-генерация позиций (из текущего HTML)
✗ PDF-парсинг
✗ Интеграция с 1С
✗ Multi-language UI (только русский)
