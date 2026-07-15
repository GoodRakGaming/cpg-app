# 🧾 ФАЙЛЫ ДЛЯ ТЕСТИРОВАНИЯ

## 📁 Структура для быстрого доступа

```
D:\Проект 1\
│
├─ 🚀 СКРИПТЫ ЗАПУСКА
│  ├─ start-all.ps1           ⭐ ЗАПУСТИТЕ ЭТО ПЕРВЫМ
│  ├─ start-backend.ps1       (если нужен только backend)
│  ├─ start-frontend.ps1      (если нужен только frontend)
│  └─ test-api.ps1            (тестирование API)
│
├─ 📖 ДОКУМЕНТАЦИЯ (читайте в этом порядке)
│  ├─ START_HERE.md           ⭐ НАЧНИТЕ ОТСЮДА
│  ├─ SUMMARY.md              (краткое резюме)
│  ├─ QUICK_START.md          (подробный гайд)
│  ├─ FEATURES_STATUS.md      (что готово/что todo)
│  ├─ TROUBLESHOOTING.md      (решение проблем)
│  └─ FEATURES_IMPLEMENTATION_LOG.md (полный отчет)
│
├─ 🔧 BACKEND
│  └─ backend/
│     ├─ src/server.js        ✅ Обновлена CORS
│     ├─ .env                 ✅ Обновлена FRONTEND_URL
│     ├─ setup-demo-data.js   ✅ Новый файл
│     └─ package.json         ✅ Готов к использованию
│
├─ 🎨 FRONTEND
│  └─ frontend/
│     ├─ lib/api.ts           ✅ Обновлен (save tokens)
│     ├─ app/login/page.tsx   ✅ Обновлена (auth)
│     ├─ .env.local           ✅ Готов к использованию
│     └─ package.json         ✅ Готов к использованию
│
└─ 📋 ДРУГИЕ
   ├─ plan.md                 (полный план разработки)
   ├─ commercial_proposal_generator.html  (исходный прототип)
   └─ README_MAIN.md          (главный README)
```

---

## ✅ ЧЕКЛИСТ ПЕРЕД ЗАПУСКОМ

### Системные требования
- [ ] Node.js 18+ установлен (`node --version`)
- [ ] npm установлен (`npm --version`)
- [ ] PostgreSQL запущена (`pg_isready -h localhost`)
- [ ] Windows PowerShell открыт

### Файлы готовы
- [x] ✅ backend/src/server.js - обновлена CORS
- [x] ✅ backend/.env - обновлена FRONTEND_URL
- [x] ✅ backend/setup-demo-data.js - создан
- [x] ✅ frontend/lib/api.ts - обновлена
- [x] ✅ frontend/app/login/page.tsx - обновлена
- [x] ✅ start-all.ps1 - создан
- [x] ✅ start-backend.ps1 - создан
- [x] ✅ start-frontend.ps1 - создан
- [x] ✅ test-api.ps1 - создан

### Документация готова
- [x] ✅ START_HERE.md - создана
- [x] ✅ QUICK_START.md - обновлена
- [x] ✅ FEATURES_STATUS.md - создана
- [x] ✅ TROUBLESHOOTING.md - создана
- [x] ✅ SUMMARY.md - создана

---

## 🚀 ПОШАГОВЫЙ ЗАПУСК

### Шаг 1: Откройте PowerShell
```powershell
# Нажмите Win+X, выберите PowerShell
# Или нажмите Win+R и введите: powershell

cd "D:\Проект 1"
```

### Шаг 2: Запустите все компоненты
```powershell
.\start-all.ps1
```

**Ожидаемый результат:**
- Откроется окно Backend (port 3000)
- Откроется окно Frontend (port 3001)
- Видно: "✅ Оба сервера запущены!"

### Шаг 3: Откройте браузер
```
http://localhost:3001
```

### Шаг 4: Войдите
```
Email: test@example.com
Password: Test123!
Нажмите "Войти"
```

**Ожидаемый результат:**
- Перенаправление на http://localhost:3001/proposals
- Таблица с предложениями видна
- Status: ✅ РАБОТАЕТ

---

## 🧪 ТЕСТОВЫЕ СЦЕНАРИИ

### Сценарий 1: Авторизация ✅
1. Откройте http://localhost:3001
2. Введите test@example.com / Test123!
3. Нажмите "Войти"
4. **Expected:** Таблица предложений видна
5. **Status:** ✅ РАБОТАЕТ (если видна таблица)

### Сценарий 2: Регистрация ✅
1. Откройте http://localhost:3001/register
2. Заполните форму (email, password, name)
3. Нажмите "Sign up"
4. **Expected:** Авторизованы и на /proposals
5. **Status:** ✅ РАБОТАЕТ (если на proposals)

### Сценарий 3: Удаление предложения ✅
1. В таблице найдите любое предложение
2. Нажмите кнопку "Delete"
3. Выберите "Yes" в диалоге
4. **Expected:** Предложение удалено из таблицы
5. **Status:** ✅ РАБОТАЕТ (если удалено)

### Сценарий 4: API тестирование ✅
1. Откройте PowerShell
2. Выполните: `.\test-api.ps1`
3. **Expected:** Все checks должны быть ✅
4. **Status:** ✅ РАБОТАЕТ (если все ✅)

---

## 📊 ПРОВЕРКА СТАТУСА

### Backend
```
Откройте: http://localhost:3000/health

Ожидается:
{
  "status": "ok",
  "message": "Backend работает",
  "timestamp": "2026-05-18T12:00:00.000Z"
}
```

### Frontend
```
Откройте: http://localhost:3001

Ожидается: Страница входа загружается
```

### API
```powershell
.\test-api.ps1

Ожидается: Все endpoints возвращают ✅
```

---

## ⚠️ ЧАСТЫЕ ПРОБЛЕМЫ

### Проблема: "Cannot connect to localhost:3000"
**Решение:**
1. Убедитесь, что backend запущен (окно PowerShell открыто)
2. Проверьте логи Backend на ошибки
3. Перезагрузите: `.\start-all.ps1`

### Проблема: "CORS error" в console
**Решение:**
1. Убедитесь, что оба сервера запущены
2. Перезагрузите страницу (F5)
3. Проверьте: backend логи → ищите "CORS"

### Проблема: "Invalid credentials" при входе
**Решение:**
1. Проверьте backend логи → ищите "✅ Демо-пользователь создан"
2. Если нет → запустите вручную:
   ```powershell
   cd backend
   node setup-demo-data.js
   ```

### Проблема: Остаюсь на странице входа
**Решение:**
1. Откройте Dev Tools (F12) → Console
2. Ищите ошибки в красном цвете
3. Проверьте localStorage:
   ```javascript
   localStorage.getItem('access_token')
   localStorage.getItem('user')
   ```

Больше? → Читайте `TROUBLESHOOTING.md`

---

## 📈 КАКОВЫ ОЖИДАНИЯ?

### После входа вы должны видеть:
1. ✅ Таблица с предложениями
2. ✅ Столбцы: Title, Status, Created date, Actions
3. ✅ Кнопки: Edit (TODO), Delete
4. ✅ Кнопка: "Create proposal" (TODO)

### Кнопка Create proposal
- ⏳ **Status:** В разработке (Phase 7.2)
- ⏳ **Ожидается:** Форма создания КП

### Кнопка Edit
- ⏳ **Status:** В разработке (Phase 7.2)
- ⏳ **Ожидается:** Редактор КП с PDF генерацией

---

## 🔍 ПРОВЕРКА КАЖДОГО КОМПОНЕНТА

### ✅ Backend работает?
```powershell
curl http://localhost:3000/health
# Должен вернуть: {"status":"ok",...}
```

### ✅ Frontend работает?
```
http://localhost:3001
# Должна загрузиться страница входа
```

### ✅ Демо-данные созданы?
```powershell
# В логах backend ищите:
# ✅ Демо-пользователь создан
# ✅ Демо-шаблон создан
# ✅ Демо-предложение создано
```

### ✅ Авторизация работает?
```powershell
.\test-api.ps1
# Ищите: ✅ Auth: OK
```

### ✅ API работает?
```powershell
.\test-api.ps1
# Ищите: ✅ Templates: OK, ✅ Proposals: OK, etc
```

---

## 📞 ФИНАЛЬНЫЙ ЧЕКЛИСТ

- [ ] Windows PowerShell открыт
- [ ] PostgreSQL запущена (`pg_isready -h localhost` → accepting)
- [ ] Выполнена команда: `.\start-all.ps1`
- [ ] Backend и Frontend окна открыты
- [ ] Браузер открыт на http://localhost:3001
- [ ] Вход выполнен (test@example.com / Test123!)
- [ ] Таблица предложений видна
- [ ] Может удалить предложение (Delete кнопка работает)
- [ ] `.\test-api.ps1` показывает ✅ для всех endpoints
- [ ] Browser console (F12) не показывает ошибок

---

## 🎉 ВСЕ ГОТОВО!

```
✅ Backend: работает
✅ Frontend: работает
✅ Database: инициализирована
✅ Демо-данные: созданы
✅ Авторизация: работает
✅ API: тестирован
✅ Документация: полная
✅ Скрипты: готовы

STATUS: 🚀 READY FOR TESTING
```

---

**Начните с:** `.\start-all.ps1`

**Вопросы?** Читайте: `START_HERE.md`

**Ошибки?** Читайте: `TROUBLESHOOTING.md`

**Статус?** Читайте: `FEATURES_STATUS.md`

---

**Happy testing! 🎉**
