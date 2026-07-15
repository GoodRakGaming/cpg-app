# 📊 Статус проекта Commercial Proposal Generator

**Обновлено:** 2026-07-15  
**Версия:** Beta, развёрнута на продакшн-домене  
**Ответственный за обновление:** System

---

## 📈 Прогресс проекта

### Общий статус: **~85% Complete** (6.5 из 8 фаз)

```
███████████████████████████████████░░░░░ 85%
Completed: 6 phases (1-5, 7+7.2) | In progress: Phase 8 (deployment) | Remaining: Phase 6
```

Приложение развёрнуто и доступно публично: **https://cp.profstroi74.ru** (LXC-контейнер на домашнем Proxmox-сервере). Подробности инфраструктуры, деплоя и известных незакрытых вопросов — в [DEPLOYMENT.md](DEPLOYMENT.md).

---

## ✅ Завершенные компоненты

### Phase 1: Backend Foundation ✅
- Express.js сервер на порту 3000
- PostgreSQL подключение (Sequelize ORM)
- Базовая структура Express app
- Error handling middleware

### Phase 2: Database Schema & Auth ✅
- User model (email, password_hash, created_at)
- Template model с JSONB данными
- Proposal & ProposalVersion моделі
- JWT аутентификация (access + refresh tokens)
- 4 Auth endpoints (register, login, logout, refresh)

### Phase 3: Template CRUD API ✅
- 7 endpoints для управления шаблонами
- Версионирование шаблонов
- CRUD операции (Create, Read, Update, Delete)
- Валидация и обработка ошибок
- 100% test coverage

### Phase 4: Proposal CRUD API ✅
- 7 endpoints для предложений
- Версионирование с историей изменений
- Restore функциональность (откат версий)
- Автоматическое создание черновиков
- 100% test coverage

### Phase 5: PDF Generation & Export ✅
- Puppeteer интеграция для HTML → PDF
- 4 PDF endpoints (generate, download, export, status)
- Browser pooling для оптимизации памяти
- Асинхронная генерация с обработкой очереди
- 100% test coverage

### Phase 7: Frontend Core ✅
- Next.js с App Router
- React компоненты на TypeScript
- Tailwind CSS стилизация
- JWT token management (localStorage + httpOnly cookie)
- Login страница (`/login`) ✅
- Register страница (`/register`) ✅
- Dashboard layout с nav (`/dashboard/`) ✅
- Proposals список (`/dashboard/proposals`) ✅

### Phase 7.2: Frontend Extended UI ✅
- Proposal Editor (`/dashboard/proposals/[id]`) ✅ — редактирование title, status, description
- Proposal versions tab с restore ✅
- PDF генерация и скачивание ✅
- Create Proposal (`/dashboard/proposals/new`) ✅
- Templates Manager (`/dashboard/templates`) ✅ — список + удаление
- Template Editor (`/dashboard/templates/[id]`) ✅ — визуальная форма (позиции + условия)
- Create Template (`/dashboard/templates/new`) ✅ — визуальная форма

**Исправленные баги:**
- `created_at` → `createdAt` в proposals.js (Sequelize underscored) — было "Invalid Date" везде
- Unwrapping `data.proposal` для single proposal API response
- PDF статус: проверка `is_cached` вместо несуществующего `status === 'ready'`
- PDF download URL: динамический hostname вместо захардкоженного localhost
- Отсутствующий endpoint `POST /api/proposals/:id/versions/:version_id/restore` — добавлен
- Убраны debug console.log из login.tsx
- Дата версии показывала `01.01.1970` — модель `ProposalVersion` объявляла колонку `createdAt` без `defaultValue`, из-за чего Sequelize слал явный `NULL` в INSERT, перебивая `DEFAULT CURRENT_TIMESTAMP` в схеме БД; добавлен `defaultValue: DataTypes.NOW`
- Preview/скачивание PDF падали с `Failed to fetch` на проде — код в `proposals/[id]/page.tsx` хардкодил `http://{hostname}:3000/api` в обход `NEXT_PUBLIC_API_URL`; заменено на общий `API_BASE_URL` из `lib/api.ts`
- Пароль при регистрации отклонялся с неинформативной ошибкой — regex валидации принимал спецсимвол только из узкого списка `@$!%*?&`; расширено до любого не-буквенно-цифрового символа
- Удалён мёртвый дублирующий файл `backend/src/validators/index.js` (Node резолвил `.js`-файл раньше одноимённой директории, так что этот код никогда не выполнялся, но вводил в заблуждение при чтении)
- Убрана плашка с демо-учётными данными (`test@example.com` / `Test123!`) со страницы логина — приложение теперь публичный продакшн, не демо-стенд
- Скачивание/экспорт PDF падали `HTTP 500: Invalid character in header content` — заголовок `Content-Disposition` собирался напрямую из `proposal.title` (кириллица), а HTTP-заголовки допускают только ISO-8859-1; добавлено RFC 5987 кодирование (`filename*=UTF-8''...`) с ASCII-фолбэком
- **Переработана логика версионирования КП** (по итогам тестирования):
  - `PUT /proposals/:id` теперь сравнивает новые данные с текущей версией (`diffProposalData`) и создаёт новую версию только при реальных изменениях — раньше каждое нажатие "Сохранить" плодило версию, даже без изменений
  - Комментарий версии теперь — короткое автоописание изменений ("Изменена цена", "Добавлено позиций: 1" и т.д.) вместо общего "Версия N"; отображается в таблице истории версий
  - Restore версии стал не создающим новую запись (просто переключает `current_version_id` на выбранную версию) — раньше каждое восстановление плодило версию-дубликат содержимого, что путало историю. Ничего не теряется: версия, которую заменили, остаётся в истории

---

## ⏳ В разработке (Future Scope)

### Phase 6: Advanced Backend Features ⏳
- Notifications API
- Export в другие форматы (Excel, Word)
- Email отправка КП
- Статистика и аналитика

### Phase 8: Deployment & Optimization 🔶 приостановлено (основное сделано)
- ✅ Production deployment — LXC на Proxmox, домен `cp.profstroi74.ru` через Nginx Proxy Manager + Let's Encrypt
- ✅ Push-to-deploy пайплайн (git push на bare-репозиторий → post-receive hook → build → pm2 reload), без Docker/CI
- ✅ Ручное end-to-end тестирование на проде: регистрация, логин, шаблоны, КП, версии, PDF preview/download — всё работает
- ⏳ Docker-контейнеризация — не делали, решили что не нужна для текущего масштаба (LXC + pm2 достаточно)
- ⏳ CI/CD pipeline (GitHub Actions) — рассматривали self-hosted runner для авто-деплоя на push, отложили; сейчас деплой запускается вручную командой `git push production main`
- ⏳ Performance optimization — не делали
- Работа над деплоем сознательно приостановлена 2026-07-15 — базовая инфраструктура и пайплайн готовы и проверены, оставшиеся пункты не блокируют использование
- Открытые вопросы и чек-лист "что доделать" — в [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📊 API Endpoints: Статус

| Категория | Endpoint | Метод | Статус | Тесты |
|-----------|----------|--------|--------|-------|
| **Auth** | /api/auth/register | POST | ✅ | ✅ |
| | /api/auth/login | POST | ✅ | ✅ |
| | /api/auth/logout | POST | ✅ | ✅ |
| | /api/auth/refresh | POST | ✅ | ✅ |
| **Templates** | /api/templates | GET | ✅ | ✅ |
| | /api/templates | POST | ✅ | ✅ |
| | /api/templates/:id | GET | ✅ | ✅ |
| | /api/templates/:id | PUT | ✅ | ✅ |
| | /api/templates/:id | DELETE | ✅ | ✅ |
| | /api/templates/:id/versions | GET | ✅ | ✅ |
| | /api/templates/:id/restore/:version | POST | ✅ | ✅ |
| **Proposals** | /api/proposals | GET | ✅ | ✅ |
| | /api/proposals | POST | ✅ | ✅ |
| | /api/proposals/:id | GET | ✅ | ✅ |
| | /api/proposals/:id | PUT | ✅ | ✅ |
| | /api/proposals/:id | DELETE | ✅ | ✅ |
| | /api/proposals/:id/versions | GET | ✅ | ✅ |
| | /api/proposals/:id/restore/:version | POST | ✅ | ✅ |
| **PDF** | /api/pdf/generate | POST | ✅ | ✅ |
| | /api/pdf/download/:id | GET | ✅ | ✅ |
| | /api/pdf/export/:id | GET | ✅ | ✅ |
| | /api/pdf/status/:id | GET | ✅ | ✅ |

**Всего endpoints:** 20 | **Готовых:** 20 ✅ | **В разработке:** 0

---

## 🧪 Тестирование

| Компонент | Тесты | Статус |
|-----------|-------|--------|
| Auth API | 5/5 | ✅ 100% |
| Templates API | 5/5 | ✅ 100% |
| Proposals API | 5/5 | ✅ 100% |
| PDF Generation | 5/5 | ✅ 100% |
| **ИТОГО** | **20/20** | **✅ 100%** |

> Фронтенд полностью реализован (Phase 7 + 7.2). Все ключевые баги исправлены. Остаётся Phase 6 (расширенный backend) и Phase 8 (деплой).

---

## 🗄️ База данных

| Таблица | Статус | Миграция | Notes |
|---------|--------|----------|-------|
| users | ✅ | 001_initial_schema.sql | Хеширование паролей + JWT |
| templates | ✅ | 001_initial_schema.sql | JSONB для данных, версионирование |
| proposals | ✅ | 001_initial_schema.sql | Черновики, версионирование, статусы |
| proposal_versions | ✅ | 001_initial_schema.sql | История изменений |

---

## 🛠️ Tech Stack

| Слой | Технология | Версия | Статус |
|------|------------|--------|--------|
| **Frontend** | Next.js | 14+ | ✅ |
| | React | 18+ | ✅ |
| | TypeScript | 5+ | ✅ |
| | Tailwind CSS | 3+ | ✅ |
| **Backend** | Node.js | 14+ | ✅ |
| | Express | 4+ | ✅ |
| | Sequelize | 6+ | ✅ |
| **Database** | PostgreSQL | 12+ | ✅ |
| **PDF** | Puppeteer | 21+ | ✅ |
| **Auth** | JWT | - | ✅ |

---

## 🚀 Демо-данные

| Тип | Значение | Статус |
|-----|----------|--------|
| Демо пользователь | test@example.com | ✅ Auto-created |
| Демо пароль | Test123! | ✅ Auto-created |
| Демо шаблон | "Стандартный шаблон" | ✅ Auto-seeded |
| Демо предложение | "Пример КП" | ✅ Auto-seeded |

---

## 📋 Критические проблемы

**Статус:** ✅ Критических проблем нет. MVP полностью функционален.

---

## 📝 Важные замечания

### Требования к окружению

```
- Node.js: v14 или выше (рекомендуется v18+)
- PostgreSQL: v12 или выше
- RAM: минимум 2GB (для Puppeteer browser pool)
- Диск: 500MB свободного места
```

### Порты

- **Backend API:** 3000 (Express)
- **Frontend UI:** 3001 (Next.js)
- **PostgreSQL:** 5432 (по умолчанию)

### Переменные окружения

Основные переменные в `.env` файлах:
- `DATABASE_URL` — подключение к PostgreSQL
- `JWT_SECRET` — секрет для подписи JWT
- `NODE_ENV` — development/production
- `CORS_ORIGIN` — CORS для фронтенда

---

## 📅 История обновлений

| Дата | Версия | Изменения |
|------|--------|-----------|
| 2026-05-21 | Beta | Phase 7+7.2 ✅ Complete. Исправлены баги A-D, добавлен visual template editor, description field в proposals, restore endpoint |
| 2026-05-20 | Beta | Phase 5 завершена, миграция документации |
| 2026-05-19 | Beta | Phase 7 (Frontend Core) завершена |
| 2026-05-18 | Beta | Phase 5 (PDF Generation) завершена |
| 2026-05-17 | Beta | Phase 4 (Proposals API) завершена |
| 2026-05-16 | Beta | Phase 3 (Templates API) завершена |

---

## 🔄 Следующие шаги

### Ближайшие приоритеты (в этом порядке)

1. **[Phase 9: Визуальный редизайн КП](PLANNING/PHASE_9_KP_VISUAL_REDESIGN.md)** — привести
   вид генерируемого КП и модель данных к тому, что реально ожидает заказчик (сейчас делается
   вручную). Цель — чтобы заказчик мог полностью перейти на генератор. Детали макета уточняются
   в отдельной сессии на реальных образцах.
2. **[Phase 10: AI-анализ рынка и каталог цен](PLANNING/PHASE_10_AI_PRICE_INTELLIGENCE.md)** —
   Nextcloud + n8n + локальный LLM автоматически извлекают цены на работы из документов
   (свои старые КП / прайсы поставщиков / конкурентов) в каталог, который подсказывает цены
   при создании нового КП. Делается **после** Phase 9. Требует отдельно разворачиваемого
   локального AI-инференса (GPU).

### Долгосрочный план

- Phase 6: Advanced Backend Features (Notifications, Exports) — отложено, не приоритет
- Phase 9: Визуальный редизайн КП (см. выше)
- Phase 10: AI-анализ рынка и каталог цен (см. выше)
- Post-Launch: Performance, Analytics, Advanced Features

---

## 📞 Контакты & Поддержка

**Документация:** `/docs/` (начните с [README.md](README.md))  
**Проблемы:** Смотрите [TROUBLESHOOTING](TROUBLESHOOTING/COMMON_ISSUES.md)  
**Тестирование:** [QUICK_TEST_5_MIN](TESTING/QUICK_TEST_5_MIN.md)

---

**Последнее обновление:** 2026-05-20 17:10  
**Следующее плановое обновление:** При завершении Phase 7.2 или Phase 6
