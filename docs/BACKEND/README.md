# 🔧 Backend Documentation

Полная документация backend API и архитектуры.

---

## 📚 Backend разделы

- **[API AUTH](API/AUTH.md)** — Аутентификация (4 endpoints)
- **[API TEMPLATES](API/TEMPLATES.md)** — Управление шаблонами (5 endpoints)
- **[API PROPOSALS](API/PROPOSALS.md)** — Управление предложениями (7 endpoints)
- **[API PDF_GENERATION](API/PDF_GENERATION.md)** — Генерация PDF (4 endpoints)
- **[API TESTING_EXAMPLES](API/TESTING_EXAMPLES.md)** — Примеры запросов

---

## 📊 Backend Фазы

| Фаза | Название | Статус | Документ |
|------|----------|--------|----------|
| 1 | Foundation | ✅ | [PHASE_1.md](PHASES/PHASE_1.md) |
| 2 | Database & Auth | ✅ | [PHASE_2.md](PHASES/PHASE_2.md) |
| 3 | Templates API | ✅ | [PHASE_3.md](PHASES/PHASE_3.md) |
| 4 | Proposals API | ✅ | [PHASE_4.md](PHASES/PHASE_4.md) |
| 5 | PDF Generation | ✅ | [PHASE_5.md](PHASES/PHASE_5.md) |

---

## 🚀 Quick Start

### Installation
```bash
cd backend
npm install
npm run dev
```

### Health Check
```bash
curl http://localhost:3000/health
```

### Run Tests
```bash
npm test
```

---

## 📋 Endpoints Summary

| Kategorie | Count | Status | Docs |
|-----------|-------|--------|------|
| Auth | 4 | ✅ | [AUTH.md](API/AUTH.md) |
| Templates | 5 | ✅ | [TEMPLATES.md](API/TEMPLATES.md) |
| Proposals | 7 | ✅ | [PROPOSALS.md](API/PROPOSALS.md) |
| PDF | 4 | ✅ | [PDF_GENERATION.md](API/PDF_GENERATION.md) |
| **Total** | **20** | **✅** | |

---

## 🔐 Architecture

- **Framework:** Express.js
- **Database:** PostgreSQL + Sequelize ORM
- **Authentication:** JWT tokens
- **PDF:** Puppeteer
- **Validation:** Joi schemas

---

## 📍 Key Files

- `src/server.js` — Express application entry point
- `src/routes/` — API endpoints (auth, templates, proposals, pdf)
- `src/models/` — Sequelize models (User, Template, Proposal, ProposalVersion)
- `src/middleware/` — JWT auth, error handling
- `src/services/` — Business logic (authService, pdfService)
- `migrations/` — Database schema
- `.env` — Configuration

---

## ✅ Status: 100% Complete

All endpoints implemented and tested.

**[← Back to main docs](../README.md)**
