# 🐛 Troubleshooting — Решение проблем

Частые проблемы и их решения.

---

## 📚 Документация

- [COMMON_ISSUES.md](COMMON_ISSUES.md) — Типичные ошибки
- [PORT_CONFLICTS.md](PORT_CONFLICTS.md) — Конфликты портов
- [DATABASE_ISSUES.md](DATABASE_ISSUES.md) — Проблемы с БД

---

## 🔴 Критические проблемы

### Backend не запускается

**Симптом:** `npm run dev` выдает ошибку

**Решения:**
1. Проверьте Node.js версию: `node --version` (нужна 14+)
2. Переустановите зависимости: `npm install`
3. Проверьте .env файл: переменные окружения
4. Посмотрите полный лог ошибки

### Frontend не загружается

**Симптом:** http://localhost:3001 не открывается

**Решения:**
1. Проверьте, запущен ли frontend: `npm run dev`
2. Проверьте консоль браузера (F12 → Console)
3. Проверьте, не занят ли порт 3001: [PORT_CONFLICTS.md](PORT_CONFLICTS.md)

### БД не подключается

**Симптом:** Ошибка ECONNREFUSED при запуске backend

**Решения:**
1. Проверьте PostgreSQL запущена: `pg_isready -h localhost`
2. Проверьте переменные в .env: DATABASE_URL, USER, PASSWORD
3. Создайте БД если не существует: `psql -U postgres -c "CREATE DATABASE proposal_generator;"`

---

## ⚠️ Частые ошибки

### 1. Port already in use

```
Error: listen EADDRINUSE :::3000
```

**Решение:** [PORT_CONFLICTS.md](PORT_CONFLICTS.md)

### 2. Database connection refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Решение:** [DATABASE_ISSUES.md](DATABASE_ISSUES.md)

### 3. Authentication failed

**Решение:** [COMMON_ISSUES.md](COMMON_ISSUES.md)

### 4. CORS error

```
Access to XMLHttpRequest blocked by CORS policy
```

**Решение:** [COMMON_ISSUES.md](COMMON_ISSUES.md)

---

## ✅ Быстрая проверка

```bash
# 1. Проверить Node.js
node --version

# 2. Проверить PostgreSQL
pg_isready -h localhost

# 3. Проверить backend
curl http://localhost:3000/health

# 4. Проверить frontend
curl http://localhost:3001
```

---

## 📞 Дальнейшая помощь

1. Прочитайте соответствующий документ выше
2. Проверьте [COMMON_ISSUES.md](COMMON_ISSUES.md)
3. Посмотрите логи в терминале
4. Проверьте Developer Tools браузера (F12)

---

**[← Back to main docs](../README.md)**
