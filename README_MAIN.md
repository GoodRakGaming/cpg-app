# 📝 Commercial Proposal Generator

**Система для создания коммерческих предложений в PDF**

---

## 🚀 БЫСТРЫЙ СТАРТ (30 секунд)

```powershell
# Откройте PowerShell в этой папке и выполните:
.\start-all.ps1
```

Откройте браузер: **http://localhost:3001**

**Демо-учетные данные:**
- Email: `test@example.com`
- Password: `Test123!`

---

## 📚 Документация

**Для новичков:**
- 📖 [`START_HERE.md`](START_HERE.md) ⭐ **НАЧНИТЕ ОТСЮДА**
- 🚀 [`QUICK_START.md`](QUICK_START.md) - Подробный гайд

**Информация о проекте:**
- 📊 [`FEATURES_STATUS.md`](FEATURES_STATUS.md) - Что готово/в разработке
- 🐛 [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) - Решение проблем
- 📋 [`FEATURES_IMPLEMENTATION_LOG.md`](FEATURES_IMPLEMENTATION_LOG.md) - Исправления

**Планирование:**
- 📅 [`plan.md`](plan.md) - Полный план разработки

---

## 🎯 Возможности

### ✅ Что работает сейчас

| Функция | Статус | Детали |
|---------|--------|--------|
| Регистрация пользователей | ✅ | Email + Password |
| Авторизация | ✅ | JWT tokens |
| Управление шаблонами | ✅ | CRUD через API |
| Создание предложений | ✅ | CRUD + версионирование |
| Генерация PDF | ✅ | Puppeteer + HTML to PDF |
| Frontend интерфейс | ✅ | React + Next.js |
| Список предложений | ✅ | Таблица с действиями |

### ⏳ В разработке

| Функция | Статус | Расчетное время |
|---------|--------|-----------------|
| Редактор предложений | Phase 7.2 | 1 неделя |
| Управление шаблонами UI | Phase 7.2 | 1 неделя |
| PDF preview & download | Phase 7.2 | 3-4 дня |
| Email отправка | Phase 7.3 | 1 неделя |
| Docker deployment | Phase 8 | 1-2 недели |

---

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                     Commercial Proposal Generator            │
└─────────────────────────────────────────────────────────────┘

Frontend (Next.js)              Backend (Express.js)           Database
   Port: 3001                      Port: 3000              (PostgreSQL)
   
┌──────────────────┐          ┌──────────────────┐       ┌──────────┐
│   React Pages    │          │  REST API        │       │ Database │
├──────────────────┤          ├──────────────────┤       ├──────────┤
│ • Login/Register │◄────────►│ • Auth (4)        │◄─────►│ Users    │
│ • Proposals List │  HTTP    │ • Templates (5)  │       │ Templates│
│ • Edit Proposal  │  REST    │ • Proposals (7)  │       │ Proposals│
│ • Templates Mgmt │  JSON    │ • PDF (4)        │       │ Versions │
│ • PDF Preview    │          │ • Health Check   │       └──────────┘
└──────────────────┘          └──────────────────┘
       |                             |
       ▼                             ▼
   TypeScript              Sequelize ORM
   Tailwind CSS            Node.js
   Responsive              Express.js
   Dark/Light Mode         Puppeteer
```

---

## 🔧 Требования

### ✅ Установлено?

- [x] Node.js 18+
- [x] npm или yarn
- [x] PostgreSQL 12+
- [x] Windows PowerShell

### Проверка

```powershell
# Node.js
node --version   # должно быть >= 18.0.0

# PostgreSQL
pg_isready -h localhost  # должно показать: accepting connections

# npm
npm --version   # должно быть >= 9.0.0
```

---

## 📁 Структура проекта

```
Commercial Proposal Generator/
├── 🚀 start-all.ps1              # Запустить Backend + Frontend
├── 🚀 start-backend.ps1          # Только Backend
├── 🚀 start-frontend.ps1         # Только Frontend
├── 🧪 test-api.ps1              # Тестирование API
│
├── 📖 START_HERE.md             # ⭐ Начните отсюда
├── 📖 QUICK_START.md            # Подробный гайд
├── 📖 FEATURES_STATUS.md        # Статус функций
├── 📖 TROUBLESHOOTING.md        # Решение проблем
├── 📖 FEATURES_IMPLEMENTATION_LOG.md
│
├── backend/                     # Express.js сервер
│   ├── src/
│   │   ├── server.js            # Main entry point
│   │   ├── config/              # Конфигурация
│   │   ├── routes/              # 20 API endpoints
│   │   ├── models/              # 7 DB моделей
│   │   ├── middleware/          # Auth, Error handlers
│   │   ├── services/            # PDF, Validations
│   │   └── validators/          # Joi schemas
│   ├── migrations/              # DB миграции
│   ├── storage/pdfs/            # Generated PDFs
│   ├── setup-demo-data.js       # Demo initialization
│   ├── package.json
│   ├── .env
│   └── README.md
│
├── frontend/                    # Next.js приложение
│   ├── app/
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home → redirect
│   │   ├── login/               # Auth pages
│   │   ├── register/
│   │   ├── proposals/           # Main pages
│   │   ├── templates/           # TODO
│   │   └── globals.css
│   ├── lib/
│   │   ├── api.ts               # API client (20 endpoints)
│   │   └── auth.ts              # Auth utilities
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── .env.local
│   └── README.md
│
└── 📅 plan.md                  # Full development plan
```

---

## 🚀 Команды

### Основные

```powershell
# Запустить всё
.\start-all.ps1

# Только backend
.\start-backend.ps1

# Только frontend
.\start-frontend.ps1

# Тестирование API
.\test-api.ps1
```

### Backend команды

```powershell
cd backend

# Development
npm run dev

# Production
npm start

# Тестирование API вручную
node setup-demo-data.js
```

### Frontend команды

```powershell
cd frontend

# Development
npm run dev

# Production build
npm run build
npm start

# Lint
npm run lint
```

### PostgreSQL

```powershell
# Подключиться
psql -U postgres -d proposal_generator

# Просмотреть таблицы
\dt

# Сброс БД
psql -U postgres -c "DROP DATABASE proposal_generator; CREATE DATABASE proposal_generator;"
```

---

## 📊 API Endpoints (20 total)

### 🔐 Authentication (4)
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `POST /api/auth/refresh` - Обновление токена

### 📋 Templates (5)
- `GET /api/templates` - Список
- `POST /api/templates` - Создание
- `GET /api/templates/:id` - Получение
- `PUT /api/templates/:id` - Обновление
- `DELETE /api/templates/:id` - Удаление

### 📄 Proposals (7)
- `GET /api/proposals` - Список
- `POST /api/proposals` - Создание
- `GET /api/proposals/:id` - Получение
- `PUT /api/proposals/:id` - Обновление
- `DELETE /api/proposals/:id` - Удаление
- `GET /api/proposals/:id/versions` - История
- `POST /api/proposals/:id/versions/:versionId/restore` - Восстановление

### 📄 PDF Generation (4)
- `POST /api/pdf/generate/:proposalId` - Генерация
- `GET /api/pdf/:proposalId` - Скачивание
- `POST /api/pdf/export/:proposalId` - Экспорт
- `GET /api/pdf/status/:proposalId` - Статус

---

## 🧪 Тестирование

### Быстрое тестирование

```powershell
# Запустить all-in-one
.\start-all.ps1

# Откройте браузер
http://localhost:3001

# Войдите
# Email: test@example.com
# Password: Test123!
```

### API тестирование

```powershell
.\test-api.ps1
```

Проверит:
- ✅ Backend health
- ✅ Auth endpoints
- ✅ Template CRUD
- ✅ Proposal CRUD
- ✅ PDF generation

---

## 🎓 Обучение

### Для разработчиков

1. **Прочитайте архитектуру** (`START_HERE.md` → Architecture)
2. **Запустите проект** (`.\start-all.ps1`)
3. **Изучите структуру** (backend/src, frontend/app)
4. **Посмотрите логи** (Backend/Frontend терминалы)
5. **Запустите тесты** (`.\test-api.ps1`)
6. **Создавайте новые компоненты** (frontend/app/*)

### Для тестировщиков

1. **Запустите** (`.\start-all.ps1`)
2. **Тестируйте функции** (login, create, delete proposals)
3. **Проверьте ошибки** (Console → F12)
4. **Пишите баги** (TROUBLESHOOTING.md)

---

## 🐛 Troubleshooting

### Общие проблемы

**"Cannot connect to localhost:3000"**
- Убедитесь, что backend запущен
- Проверьте PostgreSQL: `pg_isready -h localhost`

**"Invalid credentials" при входе**
- Убедитесь, что демо-данные созданы (видно в логах backend)
- Перезапустите: `.\start-all.ps1`

**"CORS error" в консоли**
- Убедитесь, что оба сервера запущены
- Перезагрузите страницу (F5)

**Больше ошибок?** → Смотрите [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)

---

## 📈 Прогресс разработки

```
Phase 1-5 (Backend)     ████████████████████  100% ✅
Phase 6 (Evaluation)    ████████████████████  100% ✅
Phase 7.1 (Frontend)    ████████████░░░░░░░░   60% ✅
Phase 7.2 (UI Pages)    ████░░░░░░░░░░░░░░░░   20% ⏳
Phase 7.3 (Features)    ░░░░░░░░░░░░░░░░░░░░    0% ⏳
Phase 8 (Deployment)    ░░░░░░░░░░░░░░░░░░░░    0% ⏳

Overall: ██████████████░░░░░░░░░░  65% ✅
```

---

## 📞 Контакты

- 📧 Demo Email: `test@example.com`
- 🔐 Demo Password: `Test123!`
- 🌐 Frontend: `http://localhost:3001`
- 🖥️ Backend: `http://localhost:3000`
- 📚 Documentation: [`START_HERE.md`](START_HERE.md)

---

## 📄 Лицензия

ISC License

---

## 🎉 Начните сейчас!

```powershell
.\start-all.ps1
```

**Happy coding! 🚀**
