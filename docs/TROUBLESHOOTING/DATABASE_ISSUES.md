# 🗄️ Проблемы с базой данных

Решение проблем подключения и настройки PostgreSQL.

---

## 🔴 Проблема: PostgreSQL не запущена

### Симптом
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

### Решение

**Проверка:**
```powershell
pg_isready -h localhost
# Если output: "accepting connections" - всё ОК
```

**Запуск (если установлена как сервис):**
```powershell
Start-Service postgresql-x64-15
# (замените версию на вашу)
```

**Или через Services:**
- Нажмите Win+R
- Введите `services.msc`
- Найдите "PostgreSQL Database Server"
- Нажмите "Start"

---

## 🔴 Проблема: Database не существует

### Симптом
```
Error: database "proposal_generator" does not exist
```

### Решение

**Создать БД:**
```powershell
psql -U postgres -c "CREATE DATABASE proposal_generator;"
```

**Проверить:**
```powershell
psql -U postgres -l
# Найдите "proposal_generator" в списке
```

---

## 🔴 Проблема: Неверные credentials

### Симптом
```
Error: password authentication failed for user "postgres"
```

### Решение

**Проверьте .env:**
```
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/proposal_generator
```

**Переустановите пароль PostgreSQL:**
```powershell
psql -U postgres
# ALTER USER postgres PASSWORD 'new_password';
# \q
```

---

## 🔴 Проблема: Connection timeout

### Симптом
```
Error: connect ETIMEDOUT
```

### Решение

1. PostgreSQL запущена?
   ```powershell
   pg_isready -h localhost
   ```

2. Порт 5432 открыт?
   ```powershell
   Get-NetTCPConnection -LocalPort 5432
   ```

3. Перезагрузите PostgreSQL:
   ```powershell
   Restart-Service postgresql-x64-15
   ```

---

## 🔄 Сброс БД

Если что-то сломалось:

```powershell
# 1. Удалить БД
psql -U postgres -c "DROP DATABASE proposal_generator;"

# 2. Пересоздать БД
psql -U postgres -c "CREATE DATABASE proposal_generator;"

# 3. Перезапустить backend (он пересоздаст схему)
npm run dev
```

---

## ✅ Проверка подключения

```powershell
# 1. Подключитесь к БД
psql -U postgres proposal_generator

# 2. Посмотрите таблицы
\dt

# 3. Посмотрите пользователей
SELECT * FROM users;

# 4. Выход
\q
```

---

**[← Back to troubleshooting](README.md)**
