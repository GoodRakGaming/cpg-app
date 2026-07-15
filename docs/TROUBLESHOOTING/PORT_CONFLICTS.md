# 📌 Конфликты портов

Как решить проблемы с занятыми портами.

---

## 🔴 Проблема: Port already in use

### Симптом
```powershell
Error: listen EADDRINUSE :::3000
Error: listen EADDRINUSE :::3001
```

---

## 🎯 Порты в проекте

| Порт | Сервис | По умолчанию |
|------|---------|-------------|
| **3000** | Backend (Express) | ✅ |
| **3001** | Frontend (Next.js) | ✅ |
| **5432** | PostgreSQL | ✅ |

---

## 📝 Решения

### Способ 1: Проверить что занимает порт

```powershell
# Порт 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object -Property OwningProcess

# Порт 3001
Get-NetTCPConnection -LocalPort 3001 | Select-Object -Property OwningProcess

# Порт 5432
Get-NetTCPConnection -LocalPort 5432 | Select-Object -Property OwningProcess
```

### Способ 2: Убить процесс

```powershell
# Найти PID и убить его
$process = Get-Process | Where-Object { $_.MainWindowTitle -like "*npm*" }
Stop-Process -Id $process.Id -Force

# Или более прямо (замените 1234 на PID)
Stop-Process -Id 1234 -Force
```

### Способ 3: Изменить порт

**Backend (.env):**
```
PORT=3002
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_PORT=3001
```

---

## ✅ Проверка портов

```powershell
# Все используемые порты
Get-NetTCPConnection | Where-Object { $_.LocalPort -in (3000, 3001, 5432) }

# Если пусто — порты свободны
```

---

**[← Back to troubleshooting](README.md)**
