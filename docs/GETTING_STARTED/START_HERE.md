# 🎬 НАЧНИТЕ ЗДЕСЬ - Запуск проекта

## 🚀 Самый быстрый способ (2 клика)

### Способ 1: Всё вместе (Рекомендуется) ⭐

**Откройте PowerShell в папке проекта и выполните:**
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

## 📚 Следующие шаги

После запуска:

1. **Быстрый тест** → [QUICK_TEST_5_MIN.md](../TESTING/QUICK_TEST_5_MIN.md) ⚡
2. **Подробный гайд** → [QUICK_START.md](QUICK_START.md) 📖
3. **Понять архитектуру** → [PROJECT_OVERVIEW.md](../ARCHITECTURE/PROJECT_OVERVIEW.md) 🏗️
4. **Если ошибка** → [TROUBLESHOOTING.md](../TROUBLESHOOTING/COMMON_ISSUES.md) 🐛

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

---

## 🎯 Тестовые сценарии

| № | Сценарий | Ожидаемый результат |
|---|----------|-------------------|
| 1 | Вход с демо-данными | Откроется список предложений |
| 2 | Создание нового пользователя | Регистрация и редирект на dashboard |
| 3 | Просмотр предложений | Таблица с названиями, статусами, датами |
| 4 | Удаление предложения | Предложение удалено из таблицы |
| 5 | Генерация PDF | ⏳ В разработке (Phase 7.2) |

---

## 💡 Полезные команды

```powershell
# Просмотр логов backend - в окне start-backend.ps1
# Просмотр логов frontend - в окне start-frontend.ps1

# Проверка подключения к PostgreSQL
pg_isready -h localhost

# Проверка статуса backend
curl http://localhost:3000/health
```

---

## 🐛 Если что-то не работает

1. ✅ PostgreSQL запущена? `pg_isready -h localhost`
2. ✅ Порты свободны? Проверьте [PORT_CONFLICTS.md](../TROUBLESHOOTING/PORT_CONFLICTS.md)
3. ✅ Логи backend? Смотрите ошибки в терминале
4. ✅ Браузер console? Нажмите F12 и смотрите Console tab
5. ✅ Перезагрузитесь: Ctrl+C в обоих окнах и `.\start-all.ps1` заново

---

## 📊 Архитектура проекта

```
Frontend (Next.js) ──→ Backend (Express) ──→ PostgreSQL
    :3001                   :3000              Database
    
React + TypeScript   REST API (20 endpoints)   Sequelize ORM
Tailwind CSS         JWT Authentication        Puppeteer PDF
```

---

## ⏱️ Время на запуск

- **Первый раз:** ~2-3 минуты (установка зависимостей)
- **Повторно:** ~30 секунд

---

**Готово? → [QUICK_START.md](QUICK_START.md) для подробного гайда**
