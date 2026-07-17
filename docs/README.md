# 📝 Commercial Proposal Generator — Документация

Полнофункциональная система для создания и управления коммерческими предложениями с экспортом в PDF.

> 🎯 **Начните отсюда:** [START_HERE.md](GETTING_STARTED/START_HERE.md) ⭐

---

## 🚀 БЫСТРЫЙ СТАРТ (30 секунд)

```bash
# Windows PowerShell
.\start-all.ps1

# Linux/Mac
./start-all.sh
```

Откройте браузер: **http://localhost:3001**

**Демо-учетные данные:**
- Email: `test@example.com`
- Password: `Test123!`

---

## 📚 Навигация по роли

### 👨‍💼 Для новичков (Первый запуск)
1. **[START_HERE](GETTING_STARTED/START_HERE.md)** ⭐ — Как запустить проект
2. **[QUICK_START](GETTING_STARTED/QUICK_START.md)** — Подробный гайд запуска
3. **[QUICK_TEST_5_MIN](TESTING/QUICK_TEST_5_MIN.md)** — Быстрый тест в 5 минут

---

### 👨‍💻 Для разработчиков (Backend/Frontend)

#### Архитектура & Обзор
- **[PROJECT_OVERVIEW](ARCHITECTURE/PROJECT_OVERVIEW.md)** — Архитектура проекта, 8 фаз, roadmap
- **[TECH_STACK](ARCHITECTURE/TECH_STACK.md)** — Технологии и зависимости
- **[API_OVERVIEW](ARCHITECTURE/API_OVERVIEW.md)** — Обзор всех API endpoints

#### Backend Documentation
- **[Backend README](BACKEND/README.md)** — Обзор backend, инструкции запуска
- **API Reference:**
  - [AUTH API](BACKEND/API/AUTH.md) — Регистрация, логин, refresh tokens
  - [TEMPLATES API](BACKEND/API/TEMPLATES.md) — Управление шаблонами
  - [PROPOSALS API](BACKEND/API/PROPOSALS.md) — Создание и редактирование КП
  - [PDF_GENERATION API](BACKEND/API/PDF_GENERATION.md) — Генерация PDF
  - [API Testing Examples](BACKEND/API/TESTING_EXAMPLES.md) — Примеры запросов (curl)

#### Backend Phases
- [Phase 1: Foundation](BACKEND/PHASES/PHASE_1.md) — Express + PostgreSQL ✅
- [Phase 2: Auth](BACKEND/PHASES/PHASE_2.md) — Database Schema & Authentication ✅
- [Phase 3: Templates](BACKEND/PHASES/PHASE_3.md) — Template CRUD API ✅
- [Phase 4: Proposals](BACKEND/PHASES/PHASE_4.md) — Proposal CRUD API ✅
- [Phase 5: PDF](BACKEND/PHASES/PHASE_5.md) — PDF Generation & Export ✅

#### Frontend Documentation
- **[Frontend Overview](FRONTEND/README.md)** — Структура frontend, Next.js setup
- **Frontend Phases:**
  - [Phase 7: Core](FRONTEND/PHASES/PHASE_7.md) — Next.js 14, Auth pages, Dashboard ⏳ (в активном тестировании)
  - [Phase 7.2: Extended](FRONTEND/PHASES/PHASE_7.2.md) — Proposal Editor, Templates Manager ⏳

---

### ✅ Для тестировщиков (QA)

- **[QUICK_TEST_5_MIN](TESTING/QUICK_TEST_5_MIN.md)** ⚡ — Быстрый тест функциональности
- **[TESTING_CHECKLIST](TESTING/CHECKLIST.md)** ✓ — Полный чек-лист тестирования
- **[Backend Tests Report](TESTING/BACKEND_PHASES_TESTS.md)** — Результаты тестирования всех фаз

---

### 🐛 Для решения проблем (Troubleshooting)

- **[COMMON_ISSUES](TROUBLESHOOTING/COMMON_ISSUES.md)** — Общие проблемы и решения
- **[PORT_CONFLICTS](TROUBLESHOOTING/PORT_CONFLICTS.md)** — Конфликты портов (3000, 3001)
- **[DATABASE_ISSUES](TROUBLESHOOTING/DATABASE_ISSUES.md)** — Проблемы с БД и подключением

---

## 📊 Текущий статус проекта

**Реализовано:** ✅ **~81%** основного roadmap (6.5 фаз из 8) + Phase 9 и 9B (редизайн, за рамками
исходных 8) уже готовы. Приложение развёрнуто и работает на продакшене: https://cp.profstroi74.ru

### ✅ Что готово
- ✅ **Backend** (5 фаз) — Express API 100% функциональный
- ✅ **Frontend Core + Extended** (Phase 7 + 7.2) — Auth, Dashboard, Proposals/Templates (список +
  редакторы), PDF
- ✅ **Database** — PostgreSQL + Sequelize ORM
- ✅ **Authentication** — JWT с refresh tokens
- ✅ **PDF Generation** — Puppeteer для HTML → PDF
- ✅ **Визуальный редизайн** (Phase 9 + 9B) — PDF-документ и весь веб-интерфейс на единых токенах

### ⏳ В разработке / план
- ⏳ **Phase 6** — Advanced Backend Features (Notifications, Exports) — не приоритет
- 📝 **Phase 10** — AI-анализ рынка и каталог цен (следующий приоритет)

**Последнее обновление:** 2026-07-17  
**[Подробный статус →](STATUS.md)**

---

## 📑 Полный каталог документации

**→ [Перейти к индексу всех документов](_INDEX.md)**

---

## 🎯 Наиболее используемые команды

```bash
# Backend
npm run dev          # Запуск development сервера (порт 3000)
npm test             # Запуск тестов
npm run build        # Production build

# Frontend
npm run dev          # Запуск dev сервера (порт 3001)
npm run build        # Production build

# Demo data
npm run setup-demo   # Создать демо-данные (test@example.com)

# Database
npm run migrate      # Запустить миграции
npm run seed         # Заполнить демо-данные
```

---

## 🔗 Важные ссылки

| Ресурс | URL | Описание |
|--------|-----|---------|
| Frontend | http://localhost:3001 | Web интерфейс |
| Backend API | http://localhost:3000 | REST API |
| Health Check | http://localhost:3000/health | Статус backend |
| API Docs | http://localhost:3000/api/docs | Swagger/OpenAPI (если настроено) |

---

## 💡 Советы для навигации

1. **Впервые запускаете?** → [START_HERE](GETTING_STARTED/START_HERE.md) ⭐
2. **Нужен быстрый тест?** → [QUICK_TEST_5_MIN](TESTING/QUICK_TEST_5_MIN.md)
3. **Ищете API документацию?** → [API_OVERVIEW](ARCHITECTURE/API_OVERVIEW.md)
4. **Проблема с запуском?** → [TROUBLESHOOTING](TROUBLESHOOTING/COMMON_ISSUES.md)
5. **Хотите понять архитектуру?** → [PROJECT_OVERVIEW](ARCHITECTURE/PROJECT_OVERVIEW.md)
6. **Ищете конкретный документ?** → [Полный индекс](_INDEX.md)

---

## 📝 История и архивы

Исторические снимки состояния проекта находятся в папке **[ARCHIVES](ARCHIVES/)**:
- Снимки с временными метками (для отката и анализа)
- Старые версии документации
- Logи очистки и рефакторинга

---

## ❓ Вопросы?

Если что-то непонятно:
1. Проверьте [индекс документов](_INDEX.md)
2. Посмотрите [FAQ и типичные проблемы](TROUBLESHOOTING/COMMON_ISSUES.md)
3. Запустите [QUICK_TEST_5_MIN](TESTING/QUICK_TEST_5_MIN.md) для проверки окружения

---

**Документация актуальна на:** 2026-05-20 | [Полный статус](STATUS.md)
