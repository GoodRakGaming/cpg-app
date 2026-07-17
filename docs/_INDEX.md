# 📑 Полный индекс документации

**Мастер-каталог всех документов проекта Commercial Proposal Generator.**

> Хотите быстро что-то найти? Используйте [Ctrl+F] на этой странице или перейдите на [главную страницу](README.md)

---

## 🚀 СТАРТ (начните отсюда)

| Документ | Аудитория | Описание |
|----------|-----------|---------|
| [README.md](README.md) | Все | Главная навигация и обзор проекта |
| [STATUS.md](STATUS.md) | Все | Текущее состояние проекта |
| [START_HERE.md](GETTING_STARTED/START_HERE.md) ⭐ | Новичков | Как запустить проект в 2 способа |
| [QUICK_START.md](GETTING_STARTED/QUICK_START.md) | Новичков | Подробный гайд запуска (для Windows) |
| [DEPLOYMENT.md](DEPLOYMENT.md) 🚀 | DevOps | Продакшн-деплой: Proxmox LXC, NPM, push-to-deploy, известные проблемы |

---

## 👨‍💼 НОВИЧКАМ (Getting Started)

Документы в папке **[GETTING_STARTED/](GETTING_STARTED/)**:

| Документ | Время | Цель |
|----------|-------|------|
| [START_HERE.md](GETTING_STARTED/START_HERE.md) | 5 мин | Первый запуск приложения |
| [QUICK_START.md](GETTING_STARTED/QUICK_START.md) | 15 мин | Полный гайд с примерами команд |

---

## 🏗️ АРХИТЕКТУРА (для разработчиков)

Документы в папке **[ARCHITECTURE/](ARCHITECTURE/)**:

| Документ | Фокус | Описание |
|----------|-------|---------|
| [PROJECT_OVERVIEW.md](ARCHITECTURE/PROJECT_OVERVIEW.md) | Вся система | 8 фаз, vision, roadmap, архитектура |
| [TECH_STACK.md](ARCHITECTURE/TECH_STACK.md) | Технологии | Node.js, Express, PostgreSQL, Next.js, Puppeteer |
| [API_OVERVIEW.md](ARCHITECTURE/API_OVERVIEW.md) | API | Обзор всех 20 endpoints |

---

## 🔧 BACKEND ДОКУМЕНТАЦИЯ

### Backend Обзор

Документы в папке **[BACKEND/](BACKEND/)**:

| Документ | Описание |
|----------|---------|
| [BACKEND/README.md](BACKEND/README.md) | Backend обзор, инструкции запуска, health check |

### Backend API Reference

Документы в папке **[BACKEND/API/](BACKEND/API/)**:

| Endpoint | Документ | Endpoints | Статус |
|----------|----------|-----------|--------|
| **Auth** | [AUTH.md](BACKEND/API/AUTH.md) | register, login, logout, refresh | ✅ |
| **Templates** | [TEMPLATES.md](BACKEND/API/TEMPLATES.md) | CRUD, versioning, restore | ✅ |
| **Proposals** | [PROPOSALS.md](BACKEND/API/PROPOSALS.md) | CRUD, versioning, restore | ✅ |
| **PDF** | [PDF_GENERATION.md](BACKEND/API/PDF_GENERATION.md) | generate, download, export, status | ✅ |
| **Примеры** | [TESTING_EXAMPLES.md](BACKEND/API/TESTING_EXAMPLES.md) | curl/JSON примеры всех endpoints | ✅ |

### Backend Фазы реализации

Документы в папке **[BACKEND/PHASES/](BACKEND/PHASES/)**:

| Фаза | Документ | Статус | Содержание |
|------|----------|--------|-----------|
| **1** | [PHASE_1.md](BACKEND/PHASES/PHASE_1.md) | ✅ | Express foundation, PostgreSQL connection |
| **2** | [PHASE_2.md](BACKEND/PHASES/PHASE_2.md) | ✅ | Database schema, authentication (JWT) |
| **3** | [PHASE_3.md](BACKEND/PHASES/PHASE_3.md) | ✅ | Template CRUD API (7 endpoints) |
| **4** | [PHASE_4.md](BACKEND/PHASES/PHASE_4.md) | ✅ | Proposal CRUD API (7 endpoints) |
| **5** | [PHASE_5.md](BACKEND/PHASES/PHASE_5.md) | ✅ | PDF generation (Puppeteer, 4 endpoints) |

---

## 💻 FRONTEND ДОКУМЕНТАЦИЯ

### Frontend Обзор

Документы в папке **[FRONTEND/](FRONTEND/)**:

| Документ | Описание |
|----------|---------|
| [FRONTEND/README.md](FRONTEND/README.md) | Frontend обзор, Next.js setup, структура |

### Frontend Фазы реализации

Документы в папке **[FRONTEND/PHASES/](FRONTEND/PHASES/)**:

| Фаза | Документ | Статус | Содержание |
|------|----------|--------|-----------|
| **7** | [PHASE_7.md](FRONTEND/PHASES/PHASE_7.md) | ⏳ | Next.js core, Auth pages, Dashboard, Proposals list (в активном тестировании) |
| **7.2** | [PHASE_7.2.md](FRONTEND/PHASES/PHASE_7.2.md) | ⏳ | Proposal Editor, Templates Manager, History |

---

## 🗺️ ПЛАНИРОВАНИЕ (следующие фазы)

Документы в папке **[PLANNING/](PLANNING/)** — предварительные планы, детали ещё уточняются:

| Фаза | Документ | Статус | Содержание |
|------|----------|--------|-----------|
| **9** | [PHASE_9_KP_VISUAL_REDESIGN.md](PLANNING/PHASE_9_KP_VISUAL_REDESIGN.md) | ✅ Реализовано | Визуальный редизайн КП под ожидания заказчика (модель данных + PDF + редактор) |
| **9B** | [PHASE_9B_FRONTEND_UI_DESIGN_SESSION_CONTEXT.md](PLANNING/PHASE_9B_FRONTEND_UI_DESIGN_SESSION_CONTEXT.md) | 📝 Бриф | Контекст для отдельной сессии дизайна веб-интерфейса (dashboard/формы/таблицы) |
| **9B** | [PHASE_9B_FRONTEND_UI_REDESIGN.md](PLANNING/PHASE_9B_FRONTEND_UI_REDESIGN.md) | ✅ Реализовано | Токены, компоненты, паттерны экранов — реализовано поэтапно: списки → редакторы → NavRail |
| **10** | [PHASE_10_AI_PRICE_INTELLIGENCE.md](PLANNING/PHASE_10_AI_PRICE_INTELLIGENCE.md) | 📝 План | AI-анализ рынка (Nextcloud + n8n + локальный LLM) → каталог цен для КП |

---

## ✅ ТЕСТИРОВАНИЕ (Testing)

Документы в папке **[TESTING/](TESTING/)**:

| Документ | Время | Описание | Аудитория |
|----------|-------|---------|-----------|
| [QUICK_TEST_5_MIN.md](TESTING/QUICK_TEST_5_MIN.md) | ⚡ 5 мин | Быстрый smoke test всех функций | QA, разработчики |
| [CHECKLIST.md](TESTING/CHECKLIST.md) | 📋 1 час | Полный чек-лист тестирования | QA, тестировщики |
| [BACKEND_PHASES_TESTS.md](TESTING/BACKEND_PHASES_TESTS.md) | 📊 Отчёт | Результаты тестов всех backend фаз | Разработчики |

---

## 🐛 TROUBLESHOOTING (Решение проблем)

Документы в папке **[TROUBLESHOOTING/](TROUBLESHOOTING/)**:

| Документ | Проблема | Решение |
|----------|----------|---------|
| [COMMON_ISSUES.md](TROUBLESHOOTING/COMMON_ISSUES.md) | Общие ошибки | CORS, DB, ports, npm errors |
| [PORT_CONFLICTS.md](TROUBLESHOOTING/PORT_CONFLICTS.md) | Порты заняты | Как освободить 3000, 3001, 5432 |
| [DATABASE_ISSUES.md](TROUBLESHOOTING/DATABASE_ISSUES.md) | БД не подключается | Connection strings, PostgreSQL проблемы |

---

## 📦 АРХИВЫ (Archives)

Документы в папке **[ARCHIVES/](ARCHIVES/)**:

| Папка/Файл | Содержание | Описание |
|------------|-----------|---------|
| `snapshot_20260520/` | Снимок 2026-05-20 | Полное состояние проекта на эту дату |
| `backend_docs_20260520/` | Старые backend/docs | Исторические backend документы |
| `frontend_docs_20260520/` | Старые frontend/docs | Исторические frontend документы |
| `backend_cleanup_history.md` | История очистки | Логи рефакторинга backend |
| `frontend_cleanup_history.md` | История очистки | Логи рефакторинга frontend |
| `original_plan_20260520.md` | Первоначальный план | Оригинальный план разработки (archive) |
| `editor_guide.md` | Гайд для редакторов | Как была переорганизована документация |

---

## 🎯 БЫСТРАЯ НАВИГАЦИЯ ПО ЗАДАЧАМ

### "Я хочу..."

#### 🚀 Запустить приложение
1. [START_HERE.md](GETTING_STARTED/START_HERE.md) — 5 минут
2. [QUICK_START.md](GETTING_STARTED/QUICK_START.md) — подробный гайд

#### 📊 Понять архитектуру
1. [PROJECT_OVERVIEW.md](ARCHITECTURE/PROJECT_OVERVIEW.md) — обзор системы
2. [API_OVERVIEW.md](ARCHITECTURE/API_OVERVIEW.md) — список endpoints
3. [TECH_STACK.md](ARCHITECTURE/TECH_STACK.md) — технологии

#### 🔌 Использовать API
1. [API_OVERVIEW.md](ARCHITECTURE/API_OVERVIEW.md) — какие endpoints есть
2. Выбрать нужный документ:
   - [AUTH.md](BACKEND/API/AUTH.md) — аутентификация
   - [TEMPLATES.md](BACKEND/API/TEMPLATES.md) — работа с шаблонами
   - [PROPOSALS.md](BACKEND/API/PROPOSALS.md) — работа с КП
   - [PDF_GENERATION.md](BACKEND/API/PDF_GENERATION.md) — генерация PDF
3. [TESTING_EXAMPLES.md](BACKEND/API/TESTING_EXAMPLES.md) — примеры curl запросов

#### ✅ Протестировать
1. [QUICK_TEST_5_MIN.md](TESTING/QUICK_TEST_5_MIN.md) — быстрый smoke test
2. [CHECKLIST.md](TESTING/CHECKLIST.md) — полный QA чек-лист
3. [BACKEND_PHASES_TESTS.md](TESTING/BACKEND_PHASES_TESTS.md) — результаты unit тестов

#### 🐛 Найти ошибку
1. [COMMON_ISSUES.md](TROUBLESHOOTING/COMMON_ISSUES.md) — типичные проблемы
2. [PORT_CONFLICTS.md](TROUBLESHOOTING/PORT_CONFLICTS.md) — проблемы с портами
3. [DATABASE_ISSUES.md](TROUBLESHOOTING/DATABASE_ISSUES.md) — проблемы с БД

#### 🔍 Изучить фазу
Выбрать нужную фазу:

**Backend:**
- [PHASE_1.md](BACKEND/PHASES/PHASE_1.md) — Express + PostgreSQL
- [PHASE_2.md](BACKEND/PHASES/PHASE_2.md) — Auth
- [PHASE_3.md](BACKEND/PHASES/PHASE_3.md) — Templates API
- [PHASE_4.md](BACKEND/PHASES/PHASE_4.md) — Proposals API
- [PHASE_5.md](BACKEND/PHASES/PHASE_5.md) — PDF Generation

**Frontend:**
- [PHASE_7.md](FRONTEND/PHASES/PHASE_7.md) — Core (Login, Dashboard, Proposals)
- [PHASE_7.2.md](FRONTEND/PHASES/PHASE_7.2.md) — Extended (Editor, Templates Manager)

---

## 📊 Статистика документации

| Категория | Количество | Статус |
|-----------|-----------|--------|
| **Новичкам** | 2 doc | ✅ Полно |
| **Архитектура** | 3 doc | ✅ Полно |
| **Backend API** | 5 doc | ✅ Полно |
| **Backend Фазы** | 5 doc | ✅ Полно |
| **Frontend** | 3 doc | ✅ Полно |
| **Тестирование** | 3 doc | ✅ Полно |
| **Troubleshooting** | 3 doc | ✅ Полно |
| **Архивы** | 7 items | 📦 История |
| **ИТОГО** | **31+ doc** | ✅ Организовано |

---

## 🔗 Связанные ссылки

- **[Главная страница](README.md)** — Start here
- **[Статус проекта](STATUS.md)** — 62.5% complete
- **[Вернуться в корень](/README.md)** — Корневой README

---

## 📝 Как пользоваться этим индексом

1. **Ищите свою роль:** Разработчик? QA? Новичок? Смотрите соответствующий раздел
2. **Используйте Ctrl+F:** Найдите ключевое слово (например, "API", "test", "error")
3. **Следите за статусом:** ✅ = готово, ⏳ = в разработке
4. **Читайте в порядке:** Документы структурированы логически

---

**Последнее обновление:** 2026-07-17  
**Версия документации:** 1.0  
[Вернуться к главному README](README.md)
