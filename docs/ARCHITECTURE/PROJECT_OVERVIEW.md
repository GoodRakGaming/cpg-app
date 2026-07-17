# 🏗️ Архитектура проекта

**Commercial Proposal Generator** — полнофункциональная система для создания, управления и экспорта коммерческих предложений в PDF.

---

## 🎯 Общий обзор

### Vision (Видение)

Создать web-приложение для управления коммерческими предложениями (КП) с возможностью:
- ✅ Создания и управления шаблонами
- ✅ Генерации предложений из шаблонов
- ✅ Экспорта в PDF
- ✅ Версионирования и истории
- ✅ Удобного веб-интерфейса

### Status (Статус)
- **Реализовано:** ~81% основного roadmap (6.5 фаз из 8) + Phase 9/9B (редизайн, отдельный трек за
  рамками исходных 8) уже готовы — см. [STATUS.md](../STATUS.md) для точной разбивки
- **Backend:** ✅ 100% готов
- **Frontend:** ✅ Все экраны реализованы и переведены на единую дизайн-систему (Phase 9B)
  - `/login`, `/register`, `/dashboard/proposals`, `/dashboard/templates` — списки с поиском/фильтрами
  - `/proposals/new`, `/proposals/[id]`, `/templates/new`, `/templates/[id]` — редакторы
- **Deployment:** ✅ Развёрнуто на продакшене — https://cp.profstroi74.ru

---

## 📊 Архитектура системы

```
┌─────────────────────────────────────────────────────────┐
│                     WEB BROWSER                          │
│              (http://localhost:3001)                    │
└────────────────────────┬────────────────────────────────┘
                         │
                  ▼ HTTP/HTTPS
                         │
┌─────────────────────────────────────────────────────────┐
│               FRONTEND LAYER (Next.js)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Pages:                                           │   │
│  │ • Login / Register (Auth)                        │   │
│  │ • Dashboard (Protected)                          │   │
│  │ • Proposals List                                 │   │
│  │ • Proposal Editor (TODO)                         │   │
│  │ • Templates Manager (TODO)                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Framework: Next.js 14+ | Language: TypeScript         │
│  Styling: Tailwind CSS | UI: React Components         │
└────────────────────────┬────────────────────────────────┘
                         │
                  ▼ REST API (JSON)
                  TCP Port 3000
                         │
┌─────────────────────────────────────────────────────────┐
│              BACKEND LAYER (Express.js)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Routes (20 endpoints):                           │   │
│  │ • Auth API (4 endpoints)                         │   │
│  │ • Templates API (5 endpoints)                    │   │
│  │ • Proposals API (7 endpoints)                    │   │
│  │ • PDF API (4 endpoints)                          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Framework: Express.js (Node.js) | Language: JavaScript │
│  ORM: Sequelize | Auth: JWT                            │
│  PDF: Puppeteer (Browser automation)                   │
└────────────────────────┬────────────────────────────────┘
                         │
                  ▼ PostgreSQL Driver
                  TCP Port 5432
                         │
┌─────────────────────────────────────────────────────────┐
│            DATABASE LAYER (PostgreSQL)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Tables:                                          │   │
│  │ • users (accounts, auth)                         │   │
│  │ • templates (templates)                          │   │
│  │ • proposals (КП)                                 │   │
│  │ • proposal_versions (history)                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ACID compliance | Full-text search | JSONB support    │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Структура папок

```
commercial_proposal_generator/
├── frontend/                           # Next.js приложение (Phase 7)
│   ├── app/
│   │   ├── page.tsx                   # Home (редирект)
│   │   ├── login/page.tsx             # Login page
│   │   ├── register/page.tsx          # Register page
│   │   ├── proposals/
│   │   │   ├── page.tsx               # Proposals list
│   │   │   ├── layout.tsx             # Protected layout
│   │   │   ├── [id]/page.tsx          # Proposal editor (TODO)
│   │   │   └── new/page.tsx           # Create proposal (TODO)
│   │   └── templates/                 # Templates manager (TODO)
│   ├── lib/
│   │   ├── api.ts                     # API клиент (все endpoints)
│   │   └── auth.ts                    # Auth утилиты
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                            # Express API (Phases 1-5)
│   ├── src/
│   │   ├── server.js                  # Entry point
│   │   ├── config/
│   │   │   └── database.js            # PostgreSQL connection
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT verification
│   │   │   └── errorHandler.js        # Error handling
│   │   ├── models/                    # Sequelize models
│   │   │   ├── User.js
│   │   │   ├── Template.js
│   │   │   ├── Proposal.js
│   │   │   └── ProposalVersion.js
│   │   ├── routes/                    # API endpoints
│   │   │   ├── auth.js                # Auth endpoints
│   │   │   ├── templates.js           # Template endpoints
│   │   │   ├── proposals.js           # Proposal endpoints
│   │   │   └── pdf.js                 # PDF endpoints
│   │   ├── services/
│   │   │   ├── authService.js         # Auth logic
│   │   │   └── pdfService.js          # PDF generation
│   │   ├── validators.js              # Joi schemas
│   │   └── utils/                     # Utilities
│   ├── migrations/
│   │   └── 001_initial_schema.sql     # DB schema
│   ├── storage/
│   │   └── pdfs/                      # Generated PDFs
│   ├── package.json
│   └── .env                           # Configuration
│
├── docs/                              # 📍 Новая структура документации
│   ├── README.md                      # Главная навигация
│   ├── STATUS.md                      # Текущий статус
│   ├── _INDEX.md                      # Полный индекс
│   ├── GETTING_STARTED/               # Для новичков
│   ├── ARCHITECTURE/                  # Архитектура
│   ├── BACKEND/                       # Backend документация
│   ├── FRONTEND/                      # Frontend документация
│   ├── TESTING/                       # Тестирование
│   ├── TROUBLESHOOTING/               # Решение проблем
│   └── ARCHIVES/                      # Исторические снимки
│
└── scripts/                           # Утилиты запуска
    ├── start-all.ps1                 # Запустить все
    ├── start-backend.ps1             # Запустить backend
    └── start-frontend.ps1            # Запустить frontend
```

---

## 🔄 Поток данных

### Пример: Создание нового предложения

```
1. User Interface (Frontend)
   ↓
2. React Form → API Client (lib/api.ts)
   ↓
3. HTTP POST /api/proposals
   ↓
4. Express Route Handler
   ↓
5. JWT Validation (Middleware)
   ↓
6. Input Validation (Joi)
   ↓
7. Sequelize Model (Create Proposal)
   ↓
8. PostgreSQL (INSERT into proposals table)
   ↓
9. Auto-create ProposalVersion v1
   ↓
10. Return JSON Response to Frontend
   ↓
11. React State Update → UI Refresh
```

---

## 🔐 Безопасность

### Authentication Flow

```
User Login
    ↓
POST /api/auth/login (email, password)
    ↓
Verify credentials (bcrypt password check)
    ↓
If valid:
  - Generate Access Token (15 min expiry, JWT)
  - Generate Refresh Token (7 day expiry, httpOnly cookie)
  - Return both tokens
    ↓
Frontend stores Access Token in memory
  - Add to Authorization header for all API calls
    ↓
If Access Token expires:
  - Refresh Token (from cookie) is sent to /api/auth/refresh
  - New Access Token generated and returned
    ↓
User gets logged out when:
  - Refresh Token expires (7 days)
  - User calls /api/auth/logout
```

### Authorization

Все protected endpoints проверяют:
1. ✅ Валидность JWT токена
2. ✅ Принадлежность ресурса текущему пользователю
3. ✅ Соответствие user_id в БД

---

## 📊 Data Model

```
User (1) ──────────── (Many) Template
 │id                           id
 │email                        user_id (FK)
 │password_hash                name
 │first_name                   data (JSONB)
 │created_at                   created_at
                               updated_at
                               is_active

User (1) ──────────── (Many) Proposal
                               id
                               user_id (FK)
                               title
                               template_id (FK)
                               data (JSONB)
                               status (enum)
                               created_at
                               updated_at
                               is_active
                                    ↓
                            (Many) ProposalVersion
                                    id
                                    proposal_id (FK)
                                    version_num
                                    data (JSONB)
                                    pdf_hash
                                    created_at
```

---

## 🔗 API Endpoints

### Auth (4 endpoints)
- `POST /api/auth/register` — Регистрация
- `POST /api/auth/login` — Логин
- `POST /api/auth/logout` — Логаут
- `POST /api/auth/refresh` — Refresh token

### Templates (5 endpoints)
- `POST /api/templates` — Создать
- `GET /api/templates` — Список
- `GET /api/templates/:id` — Получить
- `PUT /api/templates/:id` — Обновить
- `DELETE /api/templates/:id` — Удалить

### Proposals (7 endpoints)
- `POST /api/proposals` — Создать
- `GET /api/proposals` — Список
- `GET /api/proposals/:id` — Получить
- `PUT /api/proposals/:id` — Обновить
- `DELETE /api/proposals/:id` — Удалить
- `GET /api/proposals/:id/versions` — История версий
- `POST /api/proposals/:id/restore/:version` — Восстановить версию

### PDF (4 endpoints)
- `POST /api/pdf/generate` — Генерировать PDF
- `GET /api/pdf/download/:id` — Скачать PDF
- `GET /api/pdf/export/:id` — Экспортировать
- `GET /api/pdf/status/:id` — Статус генерации

**[Полный API Reference →](API_OVERVIEW.md)**

---

## 🔑 Ключевые компоненты

### Backend Services

**authService.js**
- Password hashing (bcryptjs)
- JWT token generation
- Token validation and refresh

**pdfService.js**
- Puppeteer browser pool management
- HTML to PDF conversion
- PDF file storage and retrieval

### Frontend Components

**API Client (lib/api.ts)**
- Centralized API endpoint definitions
- Automatic JWT token injection
- Error handling and retry logic

**Auth Utils (lib/auth.ts)**
- Token storage and retrieval
- Session management
- Protected route handling

---

## 📈 Performance

### Optimization Features
- ✅ Database indexing on foreign keys
- ✅ Connection pooling for PostgreSQL
- ✅ Browser pooling for Puppeteer
- ✅ JWT caching in memory
- ✅ Pagination on list endpoints

### Response Times
- Average: ~40ms
- Database query: ~10-20ms
- PDF generation: 2-5 seconds

---

## 🛠️ Tech Stack Details

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend UI** | React 18+ | Powerful, flexible component system |
| **Frontend Framework** | Next.js 14+ | Server-side rendering, routing, built-in optimization |
| **Frontend Styling** | Tailwind CSS | Utility-first, rapid development |
| **Frontend Language** | TypeScript | Type safety, better IDE support |
| **Backend** | Express.js | Lightweight, flexible, great middleware ecosystem |
| **Backend Language** | JavaScript (Node.js) | One language for full-stack |
| **Database** | PostgreSQL | Powerful, ACID compliant, JSONB support |
| **ORM** | Sequelize | Type-safe database queries |
| **Authentication** | JWT | Stateless, scalable, widely supported |
| **Password Hashing** | bcryptjs | Industry standard, slow by design |
| **PDF Generation** | Puppeteer | Headless Chrome, accurate rendering |
| **Validation** | Joi | Flexible schema validation |

---

## 🚀 Deployment Architecture (Future - Phase 8)

```
                    ┌─────────────┐
                    │  Cloudflare │
                    │     CDN     │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼───┐         ┌────▼───┐        ┌────▼───┐
   │ Docker │         │ Docker │        │ Docker │
   │Frontend│         │Backend │        │ PostgreSQL
   │ (3001) │         │(3000)  │        │Database
   └────────┘         └────────┘        └────────┘
```

---

## 📚 Дополнительная информация

- **[TECH_STACK.md](TECH_STACK.md)** — Детали технологий
- **[API_OVERVIEW.md](API_OVERVIEW.md)** — Все endpoints
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** — Полный обзор проекта

---

**Последнее обновление:** 2026-05-20  
**Версия:** 1.0
