# ⚠️ Частые проблемы и решения

---

## 🔴 CORS ошибка

### Симптом
```
Access to XMLHttpRequest blocked by CORS policy
```

### Решение
CORS настроен в backend. Проверьте что:
1. Frontend на `http://localhost:3001`
2. Backend на `http://localhost:3000`
3. Если используете другие порты — обновите CORS в `backend/src/server.js`

---

## 🔴 Authentication Failed

### Симптом
```
401 Unauthorized
```

### Решение
1. Проверьте, что токен в браузере хранится правильно
2. Проверьте JWT_SECRET в .env
3. Обновите страницу (F5)
4. Очистите localStorage (DevTools → Application → LocalStorage)

---

## 🔴 Password validation error

### Симптом
```
"Пароль должен быть не менее 8 символов"
```

### Решение
Пароль должен быть минимум 8 символов и содержать буквы, цифры и символы.

Допустимый пароль: `Test123!`

---

## 🔴 Email already exists

### Симптом
```
"Пользователь с таким email уже зарегистрирован"
```

### Решение
Используйте другой email адрес при регистрации.

Для тестирования используйте: `test@example.com`

---

## 🔴 404 Not Found

### Симптом
```
Cannot POST /api/proposals
```

### Решение
1. Проверьте правильность URL
2. Проверьте, что backend запущен на правильном порту
3. Проверьте методы (POST, GET, PUT, DELETE)

---

## 🔴 Database error

### Симптом
```
"Unknown column in field list"
```

### Решение
1. Перезапустите backend (он пересоздаст схему)
2. Вручную пересоздайте БД: [DATABASE_ISSUES.md](DATABASE_ISSUES.md)

---

## 🔴 Token expired

### Симптом
Перенаправление на login после 15 минут неактивности

### Решение
Это нормально! Используйте refresh token для получения нового access token.
Система делает это автоматически.

---

## ✅ Быстрая проверка

```bash
# 1. Backend здоров?
curl http://localhost:3000/health

# 2. БД подключена?
psql -U postgres proposal_generator -c "SELECT * FROM users LIMIT 1;"

# 3. Демо-пользователь существует?
psql -U postgres proposal_generator -c "SELECT email FROM users;"
```

---

**[← Back to troubleshooting](README.md)**
