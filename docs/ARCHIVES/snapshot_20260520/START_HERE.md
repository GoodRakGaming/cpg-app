# 🎬 НАЧНИТЕ ЗДЕСЬ - Запуск и тестирование проекта

## 🚀 Самый быстрый способ (2 клика)

### Способ 1: Всё вместе (Рекомендуется)

**Откройте PowerShell в этой папке и выполните:**
```powershell
.\start-all.ps1
```

✅ **Что произойдет:**
- Backend запустится на http://localhost:3000
- Frontend запустится на http://localhost:3001  
- Автоматически создадутся демо-данные
- Откроются 2 новых PowerShell окна

✅ **Откройте браузер:**
```
http://localhost:3001
```

✅ **Войдите с тестовыми учетными данными:**
```
Email:    test@example.com
Password: Test123!
```

---

## 📋 Отдельный запуск (если нужно)

### Запуск только Backend
```powershell
.\start-backend.ps1
```

### Запуск только Frontend
```powershell
.\start-frontend.ps1
```

---

## 🧪 Тестирование API без фронтенда

```powershell
.\test-api.ps1
```

Проверит все endpoints (Auth, Templates, Proposals, PDF)

---

## 📚 Документация

| Файл | Содержание |
|------|-----------|
| **QUICK_START.md** | Подробное руководство по запуску |
| **FEATURES_STATUS.md** | Что готово, что в разработке |
| **TROUBLESHOOTING.md** | Решение проблем авторизации |
| **plan.md** | Полный план разработки |

---

## ✅ Проверка статуса

### Backend здоров?
```
http://localhost:3000/health
```

### Frontend доступен?
```
http://localhost:3001
```

### API работает?
```powershell
.\test-api.ps1
```

---

## 🎯 Тестовые сценарии

### 1. Вход с демо-учетными данными ✅
- Email: `test@example.com`
- Password: `Test123!`
- Expected: Откроется список предложений

### 2. Создание нового пользователя ✅
- Нажмите "Sign up" на странице входа
- Заполните форму регистрации
- Expected: Авторизация и редирект на /proposals

### 3. Просмотр предложений ✅
- После входа должна быть таблица
- Видны: Название, Статус, Дата создания
- Кнопки: Edit, Delete

### 4. Удаление предложения ✅
- Нажмите Delete в таблице
- Выберите "Да" в диалоге подтверждения
- Expected: Предложение удалено из таблицы

### 5. Генерация PDF (В разработке ⏳)
- Функция будет добавлена в Phase 7.2
- Кнопка "Generate PDF" будет на странице редактирования

---

## 💡 Полезные команды

### Просмотр логов
```powershell
# Backend логи - в окне start-backend.ps1

# Frontend логи - в окне start-frontend.ps1
```

### Проверка БД
```powershell
# Подключиться к БД
psql -U postgres -d proposal_generator

# Просмотреть пользователей
SELECT id, email, first_name FROM users;

# Просмотреть таблицы
\dt

# Выход
\q
```

### Сброс БД (если что-то сломалось)
```powershell
psql -U postgres -c "DROP DATABASE proposal_generator;"
psql -U postgres -c "CREATE DATABASE proposal_generator;"

# Потом перезапустите backend - она пересоздается с демо-данными
```

---

## 🐛 Если что-то не работает

1. **Проверьте, что PostgreSQL запущена:**
   ```powershell
   pg_isready -h localhost
   ```

2. **Проверьте логи backend** - ищите ошибки в терминале

3. **Откройте Developer Tools** (F12) и посмотрите Console на ошибки

4. **Читайте TROUBLESHOOTING.md** - там решения для частых проблем

5. **Перезагрузитесь:**
   ```powershell
   # Закройте оба PowerShell окна (Ctrl+C)
   # Запустите .\start-all.ps1 заново
   ```

---

## 📊 Архитектура проекта

```
Frontend (Next.js)  ──────→  Backend (Express.js)  ──────→  PostgreSQL
   :3001                          :3000                       Database
   
   React              REST API                   Sequelize ORM
   TypeScript         20 endpoints               7 models
   Tailwind CSS       JWT auth                   Puppeteer PDF
```

---

## 🎓 Что изучить?

Если вы новичок в проекте:

1. **Запустите проект** (`.\start-all.ps1`)
2. **Потестируйте функции** - войдите, создайте/удалите предложение
3. **Прочитайте структуру:**
   - `backend/src/` - серверная логика
   - `frontend/app/` - React страницы
   - `frontend/lib/` - утилиты (API клиент, auth)
4. **Посмотрите логи** - поймите, как данные движутся между фронтом и бэком
5. **Изучите API** - запустите `.\test-api.ps1`

---

## 🚀 Дальнейшая разработка

### Phase 7.2 - Frontend (TODO)
- [ ] Редактор предложений (`/proposals/[id]`)
- [ ] Создание предложения (`/proposals/new`)
- [ ] Управление шаблонами (`/templates`)
- [ ] Интеграция PDF скачивания

### Phase 8 - Deployment (TODO)
- [ ] Docker контейнеры
- [ ] Production оптимизация
- [ ] Cloud deployment

---

## 📞 Быстрые ссылки

- **Frontend:** http://localhost:3001
- **Backend Health:** http://localhost:3000/health
- **API Base:** http://localhost:3000/api

- **Test Email:** test@example.com
- **Test Password:** Test123!

---

**🎉 Проект готов к тестированию! Начните с `.\start-all.ps1`**
