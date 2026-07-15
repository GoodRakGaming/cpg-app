# 🚀 QUICK START: Подробный гайд запуска

> **Впервые?** Начните с [START_HERE.md](START_HERE.md) — это быстрее!

---

## ⚙️ Требования перед запуском

Убедитесь, что установлены:
- ✅ **Node.js** v14+ (проверка: `node --version`)
- ✅ **PostgreSQL** v12+ (проверка: `psql --version`)
- ✅ **npm** (идет с Node.js)

---

## 🚀 БЫСТРЫЙ ЗАПУСК (ВСЕ В ОДНОЙ КОМАНДЕ)

### Способ 1: Запустить ВСЕ компоненты сразу

```powershell
# Откройте PowerShell в корневой папке проекта
cd "путь/к/проекту"

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

## 🔧 Пошаговый запуск (для разработки)

### Шаг 1: Подготовка PostgreSQL

```powershell
# Убедитесь, что PostgreSQL запущена
pg_isready -h localhost

# Создайте БД через psql:
psql -U postgres -c "CREATE DATABASE proposal_generator;"
```

### Шаг 2: Запуск Backend

```powershell
cd backend

# Установка зависимостей (если первый раз)
npm install

# Development режим (с автоперезагрузкой)
npm run dev
```

✅ Должно вывести:
```
✅ PostgreSQL подключение успешно установлено
🚀 Сервер запущен на http://localhost:3000
📍 Environment: development
💾 Database: proposal_generator
```

### Шаг 3: Запуск Frontend (новое окно PowerShell)

```powershell
cd frontend

# Установка зависимостей (если первый раз)
npm install

# Development режим (на порту 3001)
npm run dev
```

✅ Должно вывести:
```
ready - started server on 0.0.0.0:3001
```

📱 **Откройте браузер:** http://localhost:3001

---

## 🧪 Проверка статуса

### Backend здоров?
```powershell
Invoke-WebRequest http://localhost:3000/health | Select-Object -ExpandProperty Content
```

✅ Должен вернуть JSON:
```json
{
  "status": "ok",
  "message": "Backend работает",
  "timestamp": "2026-05-20T17:10:00.000Z"
}
```

### Frontend доступен?
```
http://localhost:3001
```

Должна открыться страница входа (Login page).

---

## 🛠️ Полезные команды

### Backend

```powershell
cd backend

npm run dev          # Development (с автоперезагрузкой)
npm start            # Production
npm test             # Запустить тесты
npm run build        # Production build

# Проверка БД
npm run migrate      # Запустить миграции
npm run seed         # Заполнить демо-данные
```

### Frontend

```powershell
cd frontend

npm run dev          # Development (на порту 3001)
npm run build        # Production build
npm start            # Запустить production build
```

### PostgreSQL

```powershell
# Подключиться к БД
psql -U postgres proposal_generator

# Просмотреть таблицы (внутри psql)
\dt

# Выход
\q
```

### Сброс БД (если что-то сломалось)

```powershell
# Удалить и пересоздать БД
psql -U postgres -c "DROP DATABASE proposal_generator;"
psql -U postgres -c "CREATE DATABASE proposal_generator;"

# Потом перезапустите backend - она пересоздается с демо-данными
```

---

## 📋 Сценарии тестирования

### 1️⃣ Вход с демо-учетными данными
```
1. Откройте http://localhost:3001
2. Введите:
   - Email: test@example.com
   - Password: Test123!
3. Нажмите "Войти"
4. Должны увидеть список предложений
```

### 2️⃣ Регистрация нового пользователя
```
1. Откройте http://localhost:3001/register
2. Заполните форму новыми данными
3. Нажмите "Зарегистрироваться"
4. Вы автоматически авторизованы
```

### 3️⃣ Просмотр предложений
```
1. После входа видите таблицу
2. Таблица показывает:
   - Название предложения
   - Статус (draft/final/archived)
   - Дата создания
   - Кнопки действия (Edit/Delete)
```

### 4️⃣ Тестирование API (без UI)

```powershell
# Запустить тесты всех endpoints
.\test-api.ps1

# Или вручную с curl
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
```

---

## ⚠️ Частые проблемы (Windows)

### Ошибка: Подключение к БД не удается
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Решение:**
```powershell
# Убедитесь, что PostgreSQL запущена
pg_isready -h localhost

# Если нет, запустите (если установлена как сервис)
Start-Service postgresql-x64-15

# Или проверьте в Services (Win+R → services.msc)
```

### Ошибка: Порт уже занят
```
Error: listen EADDRINUSE :::3000
```
**Решение:**
```powershell
# Найти процесс на порту 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object -Property OwningProcess

# Убить процесс (замените PID)
Stop-Process -Id <PID> -Force
```

### БД не существует
```
Error: database "proposal_generator" does not exist
```
**Решение:**
```powershell
psql -U postgres -c "CREATE DATABASE proposal_generator;"
```

### npm команды не работают
```
npm: The term 'npm' is not recognized
```
**Решение:** Установите Node.js с https://nodejs.org/

---

## 📚 Дальнейшее изучение

1. **Быстрый тест** → [../TESTING/QUICK_TEST_5_MIN.md](../TESTING/QUICK_TEST_5_MIN.md)
2. **Архитектура** → [../ARCHITECTURE/PROJECT_OVERVIEW.md](../ARCHITECTURE/PROJECT_OVERVIEW.md)
3. **API документация** → [../ARCHITECTURE/API_OVERVIEW.md](../ARCHITECTURE/API_OVERVIEW.md)
4. **Troubleshooting** → [../TROUBLESHOOTING/COMMON_ISSUES.md](../TROUBLESHOOTING/COMMON_ISSUES.md)

---

## 🎯 Следующие шаги

✅ Backend готов (Фазы 1-5 завершены)  
✅ Frontend базовый готов (Фаза 7)  
⏳ Фаза 7.2 — Proposal Editor, Templates Manager  
⏳ Фаза 8 — Docker & Deployment  

---

**Больше вопросов?** → [Полный индекс документации](../_INDEX.md)
