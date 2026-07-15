# 🔧 Решение проблем: Авторизация не работает

## ❌ Проблемы, которые были исправлены

### 1. ❌ CORS конфликт (FIXED ✅)
**Ошибка:** 
```
CORS error: Access to XMLHttpRequest at 'http://localhost:3000/api/auth/login' 
from origin 'http://localhost:3001' has been blocked
```

**Причина:** Backend CORS был настроен только на `http://localhost:3000`, а frontend работает на `http://localhost:3001`

**Решение:**
- ✅ Обновлен `backend/src/server.js` - добавлены оба порта в CORS whitelist
- ✅ Обновлен `.env` - добавлена переменная `FRONTEND_URL=http://localhost:3001`

**Проверка:**
```powershell
# Backend должен вывести при запуске:
# CORS origin allowed: http://localhost:3001
```

---

### 2. ❌ Демо-пользователь не существует (FIXED ✅)
**Ошибка:**
```
{
  "success": false,
  "error": {
    "status": 401,
    "message": "Invalid credentials"
  }
}
```

**Причина:** Пользователь `test@example.com` не был создан в БД

**Решение:**
- ✅ Создан скрипт `backend/setup-demo-data.js`
- ✅ Backend скрипт `start-backend.ps1` автоматически запускает `setup-demo-data.js`
- ✅ При запуске создается:
  - Пользователь: `test@example.com / Test123!`
  - Шаблон: "Стандартный шаблон"
  - Предложение: "Пример коммерческого предложения"

**Проверка:**
```powershell
# При запуске backend должно вывести:
# ✅ Демо-пользователь создан
#    📧 Email: test@example.com
#    🔐 Password: Test123!
```

---

### 3. ❌ Токен не сохраняется (FIXED ✅)
**Ошибка:** После входа страница перезагружается или остается на /login

**Причина:** 
- API клиент сохранял только access token
- Frontend не сохранял refresh token
- Login страница не обновляла auth manager правильно

**Решение:**
- ✅ Обновлен `frontend/lib/api.ts` - сохранение refresh token
- ✅ Обновлена `frontend/app/login/page.tsx` - правильное сохранение обоих токенов

---

## 🚀 Правильный процесс авторизации

### Шаг 1: Запуск backend
```powershell
cd "D:\Проект 1"
.\start-backend.ps1
```

**Ожидается вывод:**
```
🔍 Проверка PostgreSQL подключения...
✅ PostgreSQL доступна

📝 Проверка демо-данных...
✅ Демо-пользователь создан
   📧 Email: test@example.com
   🔐 Password: Test123!
   👤 Name: Test User
✅ Демо-шаблон создан
   📋 Name: Стандартный шаблон
✅ Демо-предложение создано
   📄 Title: Пример коммерческого предложения
   📊 Status: draft

🔥 Запуск backend сервера...
✅ PostgreSQL подключение успешно установлено
🚀 Сервер запущен на http://localhost:3000
```

### Шаг 2: Запуск frontend
```powershell
cd "D:\Проект 1"
.\start-frontend.ps1
```

**Ожидается вывод:**
```
🔥 Запуск frontend сервера...

ready - started server on 0.0.0.0:3001
```

### Шаг 3: Открыть в браузере
```
http://localhost:3001
```

### Шаг 4: Вход
1. Введите: `test@example.com`
2. Пароль: `Test123!`
3. Нажмите "Войти"
4. **Результат:** Должны увидеть таблицу предложений

---

## 🧪 Проверка без фронтенда (API тестирование)

Запустите скрипт тестирования:
```powershell
.\test-api.ps1
```

**Проверит:**
- ✅ Backend health check
- ✅ Auth login
- ✅ Template CRUD
- ✅ Proposal CRUD
- ✅ PDF generation

---

## ⚠️ Частые проблемы и решения

### Проблема: "Cannot connect to localhost:3000"
**Решение:**
1. Убедитесь, что backend запущен: `.\start-backend.ps1`
2. Проверьте PostgreSQL: `pg_isready -h localhost`
3. Посмотрите логи backend на ошибки

### Проблема: "Invalid credentials" при вводе test@example.com
**Решение:**
1. Убедитесь, что `setup-demo-data.js` выполнился успешно
2. Проверьте БД:
   ```powershell
   psql -U postgres -d proposal_generator -c "SELECT email FROM users;"
   ```
3. Если пользователя нет - запустите вручную:
   ```powershell
   cd backend
   node setup-demo-data.js
   ```

### Проблема: "CORS error" в браузере console
**Решение:**
1. Убедитесь, что оба сервера запущены
2. Проверьте, что frontend на `http://localhost:3001`
3. Проверьте backend CORS:
   ```powershell
   # В backend логах должно быть:
   # ✅ PostgreSQL подключение успешно установлено
   ```

### Проблема: Остаюсь на странице авторизации после входа
**Решение:**
1. Откройте Developer Tools (F12) → Console
2. Проверьте наличие ошибок
3. Проверьте localStorage:
   ```javascript
   // В console браузера:
   localStorage.getItem('access_token')
   localStorage.getItem('user')
   ```
4. Если оба есть - перезагрузите страницу (F5)

---

## ✅ Полный чек-лист

- [ ] PostgreSQL запущена (`pg_isready -h localhost` → accepting connections)
- [ ] Backend запущен на `http://localhost:3000/health`
- [ ] Frontend запущен на `http://localhost:3001`
- [ ] Демо-пользователь создан (в логах backend)
- [ ] Можно войти с `test@example.com / Test123!`
- [ ] После входа видите список предложений
- [ ] localStorage содержит `access_token` и `user`

---

## 🎯 Что дальше?

После успешной авторизации:
1. ✅ Вы видите страницу `/proposals` с таблицей
2. ✅ Есть кнопка "Create proposal" (в разработке)
3. ✅ Есть кнопки Delete для каждого предложения
4. ⏳ TODO: Редактор предложения (Phase 7.2)

---

**Все проблемы исправлены. Проект готов к тестированию! 🚀**
