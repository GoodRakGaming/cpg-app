# 🚀 QUICK START: Запуск проекта локально

## ⚙️ Платформа: Windows

> **Примечание**: Все команды рассчитаны на Windows PowerShell. Для CMD используйте эквивалентные команды.

---

## 🚀 **БЫСТРЫЙ ЗАПУСК (ВСЕ В ОДНОЙ КОМАНДЕ)**

### Способ 1: Запустить ВСЕ компоненты сразу

```powershell
# Откройте PowerShell в корневой папке проекта
cd "D:\Проект 1"

# Запустите скрипт - он откроет 2 окна PowerShell автоматически
.\start-all.ps1
```

**Что произойдет:**
- ✅ Backend запустится на `http://localhost:3000`
- ✅ Frontend запустится на `http://localhost:3001`
- ✅ PostgreSQL автоматически проверится
- ✅ node_modules установятся (если нужно)

**Откройте браузер:**
```
http://localhost:3001
```

**Демо-учетные данные:**
```
Email: test@example.com
Password: Test123!
```

---

## 🔧 Для разработки

### 1. Подготовка PostgreSQL (Windows)

```powershell
# Убедитесь, что PostgreSQL запущена (в Services)
# Проверка подключения:
pg_isready -h localhost

# Создайте БД через psql:
psql -U postgres
```

Внутри psql консоли:
```sql
CREATE DATABASE proposal_generator;
\q
```

Или одной командой:
```powershell
psql -U postgres -c "CREATE DATABASE proposal_generator;"
```

### 2. Запуск Backend (Фаза 1-5) ✅

**Способ 1: Через скрипт**
```powershell
cd "D:\Проект 1"
.\start-backend.ps1
```

**Способ 2: Вручную**
```powershell
cd backend
npm install  # Если не устанавливали
npm run dev
```

✅ Должно вывести:
```
✅ PostgreSQL подключение успешно установлено
🚀 Сервер запущен на http://localhost:3000
📍 Environment: development
💾 Database: proposal_generator
```

---

### 3. Запуск Frontend (Фаза 7) ✅

**Способ 1: Через скрипт**
```powershell
cd "D:\Проект 1"
.\start-frontend.ps1
```

**Способ 2: Вручную**
```powershell
cd frontend
npm install  # Если не устанавливали
npm run dev  # Запустится на порту 3001
```

✅ Должно вывести:
```
ready - started server on 0.0.0.0:3001
```

📱 **Откройте браузер:** http://localhost:3001

---

### 4. Проверка Backend

```powershell
# В другом PowerShell окне:
Invoke-WebRequest http://localhost:3000/health | Select-Object -ExpandProperty Content

# Или используйте curl (если установлен):
curl http://localhost:3000/health
```

✅ Должен вернуться JSON:
```json
{
  "status": "ok",
  "message": "Backend работает",
  "timestamp": "2026-05-06T04:28:46.942Z"
}
```

---

## 📋 Структура проекта

```
Проект 1/
├── start-all.ps1                       # 🚀 Запустить ВСЕ (Backend + Frontend)
├── start-backend.ps1                   # 🚀 Запустить Backend (порт 3000)
├── start-frontend.ps1                  # 🚀 Запустить Frontend (порт 3001)
├── commercial_proposal_generator.html  # Исходный HTML-прототип
├── plan.md                             # Полный план разработки
├── QUICK_START.md                      # Этот файл
├── backend/
│   ├── src/
│   │   ├── server.js                   # Express сервер (порт 3000)
│   │   ├── config/database.js
│   │   ├── middleware/
│   │   ├── routes/                     # 20 endpoints
│   │   ├── models/                     # 7 DB моделей
│   │   ├── services/                   # PDF, Auth, etc
│   │   └── validators/
│   ├── storage/pdfs/                   # Сгенерированные PDF
│   ├── migrations/                     # DB миграции
│   ├── .env                            # Конфигурация backend
│   ├── package.json
│   ├── README.md
│   └── PHASE_5_STATUS.md               # Статус Phase 5
└── frontend/                           # Phase 7 (Next.js)
    ├── app/
    │   ├── page.tsx                    # Home (редирект)
    │   ├── login/page.tsx              # Страница входа
    │   ├── register/page.tsx           # Регистрация
    │   ├── proposals/
    │   │   ├── page.tsx                # Список КП
    │   │   ├── layout.tsx              # Защищённый layout
    │   │   ├── [id]/page.tsx           # Редактор КП (TODO)
    │   │   └── new/page.tsx            # Создать КП (TODO)
    │   └── templates/ (TODO)
    ├── lib/
    │   ├── api.ts                      # API клиент (все 20 endpoints)
    │   └── auth.ts                     # Auth утилиты
    ├── .env.local                      # Config (PORT=3001, API_URL=:3000/api)
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.ts
    └── PHASE_7_STATUS.md
```

---

## 🔄 Статус реализации

| Фаза | Статус | Описание |
|------|--------|---------|
| 1 | ✅ | Backend Foundation - Express, Sequelize, CORS, Error Handler |
| 2 | ✅ | Database Schema & JWT Auth - Миграции, 4 endpoints |
| 3 | ✅ | Template Management API - CRUD (5 endpoints) |
| 4 | ✅ | Proposal CRUD API - Управление КП и версионированием (7 endpoints) |
| 5 | ✅ | PDF Generation Engine - Puppeteer интеграция (4 endpoints) |
| 6 | ✅ | Evaluation - Архитектурные решения приняты |
| 7 | ⏳ | Frontend (React/Next.js) - UI интерфейс (60% готово) |
| 8 | ⏳ | Docker Deployment - Контейнеризация |

**Текущее состояние:**
- ✅ Backend полностью готов (20 endpoints, 100% протестировано)
- ⏳ Frontend в разработке (6 страниц готовы, 4 страницы TODO)

---

## 🛠️ Полезные команды (Windows PowerShell)

### Запуск (основные)

```powershell
# Запустить ВСЕ (Backend + Frontend в разных окнах)
.\start-all.ps1

# Только Backend
.\start-backend.ps1

# Только Frontend
.\start-frontend.ps1
```

### Backend

```powershell
cd backend

# Development (с автоперезагрузкой)
npm run dev

# Production
npm start

# Проверка подключения БД
node -e "require('dotenv').config(); const db = require('./src/config/database'); db.authenticate().then(() => console.log('✅ OK')).catch(e => console.error('❌', e))"

# Остановить сервер
Ctrl+C
```

### Frontend

```powershell
cd frontend

# Development (на порту 3001)
npm run dev

# Production build
npm run build

# Запустить production build
npm start

# Остановить сервер
Ctrl+C
```

### PostgreSQL (Windows)

```powershell
# Подключиться к БД
psql -U postgres proposal_generator

# Просмотреть таблицы (внутри psql)
\dt

# Выйти
\q
```

### Сброс БД (Windows)

```powershell
# Через psql одной командой
psql -U postgres -c "DROP DATABASE proposal_generator;"
psql -U postgres -c "CREATE DATABASE proposal_generator;"

# Или вручную через psql
psql -U postgres
# DROP DATABASE proposal_generator;
# CREATE DATABASE proposal_generator;
# \q
```

---

## ⚠️ Частые проблемы (Windows)

### Ошибка подключения к БД
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Решение**: Убедитесь, что PostgreSQL запущена

```powershell
# 1. Проверить подключение
pg_isready -h localhost

# 2. Запустить PostgreSQL (если установлена как сервис)
Start-Service postgresql-x64-15  # или ваша версия

# 3. Проверить в Services (Win+R → services.msc)
# Найти "PostgreSQL Database Server" и убедиться, что Running
```

### Порт уже занят
```
Error: listen EADDRINUSE :::3000
```
**Решение**: Измените PORT в `.env` или убейте процесс

```powershell
# Найти процесс на порту 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object -Property OwningProcess

# Убить процесс (замените PID на найденный ID)
Stop-Process -Id <PID> -Force

# Или просто измените PORT в .env файле
# PORT=3001
```

### БД не существует
```
Error: database "proposal_generator" does not exist
```
**Решение**: Создайте БД

```powershell
psql -U postgres -c "CREATE DATABASE proposal_generator;"
```

### Ошибка: postgres пользователь не существует
```
Error: role 'postgres' does not exist
```
**Решение**: Проверьте имя пользователя и обновите `.env`

```powershell
# Убедитесь, что используется правильное имя пользователя PostgreSQL
# По умолчанию: postgres
# Если другое, обновите DATABASE_USER в .env
```

### npm команды не работают
```
npm: The term 'npm' is not recognized
```
**Решение**: Установите Node.js или обновите PATH

```powershell
# Проверить наличие Node.js
node --version
npm --version

# Если не установлены:
# https://nodejs.org/ (установить LTS версию)
```

---

## 📚 Документация

- **Полный план**: [план.md](plan.md)
- **Backend README**: [backend/README.md](backend/README.md)
- **Статус Фазы 1**: [backend/PHASE_1_STATUS.md](backend/PHASE_1_STATUS.md)

---

## 🎯 Следующие шаги

1. ✅ **Фаза 1 завершена** - Backend готов к работе
2. 🔄 **Фаза 2** - Реализация Database Schema & JWT Auth
   - Создайте миграцию для таблиц
   - Напишите модели
   - Реализуйте auth endpoints

Следуйте плану в [план.md](plan.md) для деталей каждой фазы.

---

**Автор**: GitHub Copilot  
**Дата**: 4 мая 2026  
**Версия**: 1.0.0
