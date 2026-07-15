# 🔌 API Overview — Полный справочник

Все 20 endpoints проекта Commercial Proposal Generator.

---

## 📊 Краткая таблица

| Категория | Endpoint | Метод | Статус | Тесты |
|-----------|----------|-------|--------|-------|
| **Auth (4)** | `/api/auth/register` | POST | ✅ | ✅ |
| | `/api/auth/login` | POST | ✅ | ✅ |
| | `/api/auth/logout` | POST | ✅ | ✅ |
| | `/api/auth/refresh` | POST | ✅ | ✅ |
| **Templates (5)** | `/api/templates` | GET | ✅ | ✅ |
| | `/api/templates` | POST | ✅ | ✅ |
| | `/api/templates/:id` | GET | ✅ | ✅ |
| | `/api/templates/:id` | PUT | ✅ | ✅ |
| | `/api/templates/:id` | DELETE | ✅ | ✅ |
| **Proposals (7)** | `/api/proposals` | GET | ✅ | ✅ |
| | `/api/proposals` | POST | ✅ | ✅ |
| | `/api/proposals/:id` | GET | ✅ | ✅ |
| | `/api/proposals/:id` | PUT | ✅ | ✅ |
| | `/api/proposals/:id` | DELETE | ✅ | ✅ |
| | `/api/proposals/:id/versions` | GET | ✅ | ✅ |
| | `/api/proposals/:id/restore/:version` | POST | ✅ | ✅ |
| **PDF (4)** | `/api/pdf/generate` | POST | ✅ | ✅ |
| | `/api/pdf/download/:id` | GET | ✅ | ✅ |
| | `/api/pdf/export/:id` | GET | ✅ | ✅ |
| | `/api/pdf/status/:id` | GET | ✅ | ✅ |

**Всего:** 20 endpoints | **Готовых:** 20 ✅ | **Протестировано:** 20/20 ✅

---

## 🔐 Authentication API (4 endpoints)

### POST /api/auth/register
Регистрация нового пользователя.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "Иван",
  "last_name": "Иванов"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "Иван",
      "last_name": "Иванов"
    },
    "tokens": {
      "access_token": "eyJhbGc...",
      "refresh_token": "token..."
    }
  }
}
```

---

### POST /api/auth/login
Логин пользователя.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "access_token": "eyJhbGc...",
    "refresh_token": "token..." (в cookie)
  }
}
```

---

### POST /api/auth/logout
Выход из системы.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /api/auth/refresh
Обновить access token.

**Request:**
```json
{
  "refresh_token": "token..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc..."
  }
}
```

---

## 📋 Templates API (5 endpoints)

### POST /api/templates
Создать новый шаблон.

**Headers:** Authorization: Bearer {access_token}

**Request:**
```json
{
  "name": "Стандартный шаблон",
  "data": {
    "header": "...",
    "items": [...]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Стандартный шаблон",
    "data": {...},
    "user_id": "uuid",
    "created_at": "2026-05-20T17:10:00Z"
  }
}
```

---

### GET /api/templates
Получить список шаблонов.

**Query Parameters:**
- `limit` (default: 10)
- `offset` (default: 0)
- `sort` (created_at, name)
- `order` (ASC, DESC)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "templates": [...],
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```

---

### GET /api/templates/:id
Получить один шаблон.

**Response (200):**
```json
{
  "success": true,
  "data": { template object }
}
```

---

### PUT /api/templates/:id
Обновить шаблон.

**Request:**
```json
{
  "name": "Обновленное имя",
  "data": {...}
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { updated template object }
}
```

---

### DELETE /api/templates/:id
Удалить шаблон (soft delete).

**Response (200):**
```json
{
  "success": true,
  "message": "Template deleted"
}
```

---

## 💼 Proposals API (7 endpoints)

### POST /api/proposals
Создать новое предложение.

**Request:**
```json
{
  "title": "КП для компании XYZ",
  "template_id": "uuid",
  "data": {
    "items": [...]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "КП для компании XYZ",
    "status": "draft",
    "current_version": 1,
    "created_at": "2026-05-20T17:10:00Z"
  }
}
```

---

### GET /api/proposals
Получить список предложений.

**Query Parameters:**
- `limit`, `offset` — пагинация
- `sort`, `order` — сортировка
- `status` — фильтр (draft, final, archived)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "proposals": [...],
    "total": 10,
    "limit": 10,
    "offset": 0
  }
}
```

---

### GET /api/proposals/:id
Получить одно предложение с текущей версией.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "status": "draft",
    "current_version": 1,
    "data": {...},
    "created_at": "..."
  }
}
```

---

### PUT /api/proposals/:id
Обновить предложение (автоматически создает новую версию).

**Request:**
```json
{
  "title": "Новое имя",
  "data": {...}
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "current_version": 2,  // ← Версия увеличена
    "updated_at": "..."
  }
}
```

---

### DELETE /api/proposals/:id
Удалить предложение (soft delete).

**Response (200):**
```json
{
  "success": true,
  "message": "Proposal deleted"
}
```

---

### GET /api/proposals/:id/versions
Получить историю всех версий.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "version_num": 1,
      "created_at": "...",
      "pdf_hash": "sha256..."
    },
    {
      "version_num": 2,
      "created_at": "...",
      "pdf_hash": "sha256..."
    }
  ]
}
```

---

### POST /api/proposals/:id/restore/:version
Восстановить конкретную версию.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "current_version": 3,  // ← Новая версия с восстановленными данными
    "message": "Restored from version 1"
  }
}
```

---

## 📄 PDF API (4 endpoints)

### POST /api/pdf/generate
Генерировать PDF из предложения.

**Request:**
```json
{
  "proposal_id": "uuid"
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "pdf_id": "uuid",
    "status": "generating",
    "message": "PDF generation started"
  }
}
```

---

### GET /api/pdf/download/:id
Скачать сгенерированный PDF.

**Response (200):**
- Content-Type: application/pdf
- Binary PDF data

---

### GET /api/pdf/export/:id
Экспортировать КП (альтернативная точка экспорта).

**Response (200):**
- Content-Type: application/pdf
- Binary PDF data

---

### GET /api/pdf/status/:id
Проверить статус генерации PDF.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pdf_id": "uuid",
    "status": "completed",  // или "generating", "error"
    "progress": 100,
    "file_size": "102400"
  }
}
```

---

## 📊 Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }  // или массив
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## 🔐 Authorization Header

Для всех protected endpoints используйте:
```
Authorization: Bearer {access_token}
```

Пример с curl:
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:3000/api/proposals
```

---

## 🧪 Статус коды

| Код | Значение | Когда |
|-----|----------|-------|
| 200 | OK | Успешный GET/PUT/DELETE |
| 201 | Created | Успешный POST |
| 202 | Accepted | Асинхронная операция (PDF generation) |
| 400 | Bad Request | Ошибка валидации |
| 401 | Unauthorized | Нет/невалидный токен |
| 403 | Forbidden | Нет доступа к ресурсу |
| 404 | Not Found | Ресурс не найден |
| 409 | Conflict | Конфликт (например, дублирование email) |
| 500 | Server Error | Внутренняя ошибка сервера |

---

## 📈 Rate Limiting

Текущая версия без rate limiting (может быть добавлено в Phase 6).

---

## 🔄 Pagination

Для endpoint-ов списков поддерживается пагинация:
- `limit` — кол-во записей (default: 10, max: 100)
- `offset` — смещение (default: 0)

Пример:
```
GET /api/proposals?limit=20&offset=40
```

---

## 📚 Дополнительно

- **[AUTH.md](../BACKEND/API/AUTH.md)** — Детали аутентификации
- **[TEMPLATES.md](../BACKEND/API/TEMPLATES.md)** — API шаблонов
- **[PROPOSALS.md](../BACKEND/API/PROPOSALS.md)** — API предложений
- **[PDF_GENERATION.md](../BACKEND/API/PDF_GENERATION.md)** — PDF генерация
- **[TESTING_EXAMPLES.md](../BACKEND/API/TESTING_EXAMPLES.md)** — Примеры запросов

---

**Последнее обновление:** 2026-05-20  
**Версия:** 1.0
