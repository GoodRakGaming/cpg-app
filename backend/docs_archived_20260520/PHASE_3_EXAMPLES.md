# 🧪 Template API Testing Examples — Фаза 3

## PowerShell Примеры для тестирования Template Management API

### 🔐 ПОДГОТОВКА: Получить Access Token

```powershell
# Регистрация нового пользователя
$registerBody = @{
    email = "template-user@test.com"
    password = "TemplatePass123!"
    first_name = "Template"
    last_name = "Tester"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $registerBody

$userData = $registerResponse.Content | ConvertFrom-Json
$env:TOKEN = $userData.data.tokens.access_token
$env:USER_ID = $userData.data.user.id

Write-Host "✅ User registered: $($userData.data.user.email)"
Write-Host "✅ Token saved to env:TOKEN"
```

---

### 1️⃣ CREATE TEMPLATE (POST /api/templates)

**Простой шаблон:**
```powershell
$body = @{
    name = "Простой шаблон КП"
    description = "Базовое коммерческое предложение"
    data = @{
        company_name = "placeholder"
        services = @(
            @{ name = "Услуга 1"; price = 0 }
        )
    }
} | ConvertTo-Json -Depth 5

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $env:TOKEN"; "Content-Type"="application/json"} `
  -Body $body

$template = $response.Content | ConvertFrom-Json
$env:TEMPLATE_ID = $template.data.template.id

Write-Host "✅ Template created: $($template.data.template.name)"
Write-Host "✅ Template ID: $env:TEMPLATE_ID"
$template | ConvertTo-Json -Depth 5
```

**Расширенный шаблон с секциями:**
```powershell
$body = @{
    name = "Профессиональное КП"
    description = "Полнофункциональный шаблон предложения"
    version = 1
    data = @{
        sections = @(
            @{
                id = "header"
                title = "Заголовок"
                fields = @("company_logo", "proposal_date", "client_name")
            },
            @{
                id = "description"
                title = "Описание проекта"
                fields = @("problem_statement", "proposed_solution")
            },
            @{
                id = "pricing"
                title = "Стоимость"
                items = @(
                    @{ name = "Разработка"; price = 50000 },
                    @{ name = "Тестирование"; price = 10000 },
                    @{ name = "Развёртывание"; price = 5000 }
                )
            },
            @{
                id = "terms"
                title = "Условия"
                fields = @("payment_method", "delivery_date", "warranty_period")
            }
        )
    }
} | ConvertTo-Json -Depth 10

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $env:TOKEN"; "Content-Type"="application/json"} `
  -Body $body

$template = $response.Content | ConvertFrom-Json
$env:TEMPLATE_ID_2 = $template.data.template.id

Write-Host "✅ Extended template created: $($template.data.template.name)"
Write-Host "✅ Template ID: $env:TEMPLATE_ID_2"
```

---

### 2️⃣ GET TEMPLATES LIST (GET /api/templates)

**Без параметров (default limit=10, offset=0):**
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates" `
  -Headers @{"Authorization"="Bearer $env:TOKEN"}

$data = $response.Content | ConvertFrom-Json
Write-Host "✅ Total templates: $($data.data.pagination.total)"
Write-Host "✅ Page: $($data.data.pagination.page)/$($data.data.pagination.pages)"
$data.data.templates | ForEach-Object { Write-Host "  - $($_.name)" }
```

**С пагинацией (limit=5, offset=0):**
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates?limit=5&offset=0" `
  -Headers @{"Authorization"="Bearer $env:TOKEN"}

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
```

**С сортировкой (по имени, ascending):**
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates?sort=name&order=asc" `
  -Headers @{"Authorization"="Bearer $env:TOKEN"}

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**С сортировкой (по дате создания, descending):**
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates?sort=created_at&order=desc" `
  -Headers @{"Authorization"="Bearer $env:TOKEN"}

$data = $response.Content | ConvertFrom-Json
Write-Host "✅ Latest templates:"
$data.data.templates | ForEach-Object { Write-Host "  - $($_.name) (создан: $($_.created_at))" }
```

---

### 3️⃣ GET SINGLE TEMPLATE (GET /api/templates/:id)

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates/$env:TEMPLATE_ID" `
  -Headers @{"Authorization"="Bearer $env:TOKEN"}

$template = $response.Content | ConvertFrom-Json
Write-Host "✅ Template: $($template.data.template.name)"
Write-Host "✅ Description: $($template.data.template.description)"
Write-Host "✅ Version: $($template.data.template.version)"
$template.data.template.data | ConvertTo-Json -Depth 5
```

**Проверка 404 (несуществующий ID):**
```powershell
$fakeId = "00000000-0000-0000-0000-000000000000"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates/$fakeId" `
      -Headers @{"Authorization"="Bearer $env:TOKEN"} `
      -ErrorAction Stop
} catch {
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $error = $reader.ReadToEnd() | ConvertFrom-Json
    Write-Host "❌ Expected error (404): $($error.error.message)"
}
```

---

### 4️⃣ UPDATE TEMPLATE (PUT /api/templates/:id)

**Обновить название:**
```powershell
$body = @{
    name = "ОБНОВЛЕННЫЙ: Профессиональное КП"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates/$env:TEMPLATE_ID" `
  -Method PUT `
  -Headers @{"Authorization"="Bearer $env:TOKEN"; "Content-Type"="application/json"} `
  -Body $body

$template = $response.Content | ConvertFrom-Json
Write-Host "✅ Template updated: $($template.data.template.name)"
Write-Host "✅ Updated at: $($template.data.template.updated_at)"
```

**Обновить данные (data):**
```powershell
$body = @{
    data = @{
        company_name = "ООО Новая Компания"
        services = @(
            @{ name = "Услуга 1"; price = 15000 },
            @{ name = "Услуга 2"; price = 25000 }
        )
    }
} | ConvertTo-Json -Depth 5

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates/$env:TEMPLATE_ID" `
  -Method PUT `
  -Headers @{"Authorization"="Bearer $env:TOKEN"; "Content-Type"="application/json"} `
  -Body $body

$template = $response.Content | ConvertFrom-Json
Write-Host "✅ Template data updated"
$template.data.template.data | ConvertTo-Json
```

**Обновить несколько полей:**
```powershell
$body = @{
    name = "Final: Финальный шаблон"
    description = "Это финальная версия шаблона"
    data = @{
        version = "2.0"
        updated = "2026-05-06"
    }
} | ConvertTo-Json -Depth 3

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates/$env:TEMPLATE_ID" `
  -Method PUT `
  -Headers @{"Authorization"="Bearer $env:TOKEN"; "Content-Type"="application/json"} `
  -Body $body

$template = $response.Content | ConvertFrom-Json
$template.data.template | ConvertTo-Json
```

---

### 5️⃣ DELETE TEMPLATE (DELETE /api/templates/:id)

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates/$env:TEMPLATE_ID" `
  -Method DELETE `
  -Headers @{"Authorization"="Bearer $env:TOKEN"}

$result = $response.Content | ConvertFrom-Json
Write-Host "✅ Template deleted: $($result.data.id)"
Write-Host "✅ Message: $($result.message)"
```

**Проверка что удалён (должен вернуть 404):**
```powershell
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates/$env:TEMPLATE_ID" `
      -Headers @{"Authorization"="Bearer $env:TOKEN"} `
      -ErrorAction Stop
} catch {
    Write-Host "✅ Template correctly marked as deleted (404 returned)"
}
```

---

## ❌ ТЕСТИРОВАНИЕ ОШИБОК

### Ошибка 1: Отсутствие authentication token

```powershell
# Запрос БЕЗ Authorization header
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates" `
      -ErrorAction Stop
} catch {
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $error = $reader.ReadToEnd() | ConvertFrom-Json
    Write-Host "❌ Expected error (401): $($error.error.message)"
}
```

### Ошибка 2: Невалидный token

```powershell
$invalidToken = "invalid.token.here"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates" `
      -Headers @{"Authorization"="Bearer $invalidToken"} `
      -ErrorAction Stop
} catch {
    Write-Host "❌ Expected error (401): Invalid token"
}
```

### Ошибка 3: Отсутствие обязательного поля

```powershell
# Попытка создать template БЕЗ name
$body = @{
    description = "Без названия"
    data = @{}
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates" `
      -Method POST `
      -Headers @{"Authorization"="Bearer $env:TOKEN"; "Content-Type"="application/json"} `
      -Body $body `
      -ErrorAction Stop
} catch {
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $error = $reader.ReadToEnd() | ConvertFrom-Json
    Write-Host "❌ Expected error (400): $($error.error.message)"
}
```

### Ошибка 4: Доступ к чужому шаблону

```powershell
# Регистрируем второго пользователя
$registerBody = @{
    email = "another-user@test.com"
    password = "AnotherPass123!"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $registerBody

$anotherUser = $registerResponse.Content | ConvertFrom-Json
$anotherToken = $anotherUser.data.tokens.access_token

# Пытаемся получить шаблон первого пользователя со своего токена
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/templates/$env:TEMPLATE_ID" `
      -Headers @{"Authorization"="Bearer $anotherToken"} `
      -ErrorAction Stop
} catch {
    Write-Host "✅ Security check passed: User cannot access other user's template (404)"
}
```

---

## 📊 ПОЛНЫЙ WORKFLOW (Copy-Paste готово)

```powershell
Write-Host "=== PHASE 3: TEMPLATE API TESTING ===" -ForegroundColor Cyan

# 1️⃣ РЕГИСТРАЦИЯ
Write-Host "`n=== 1️⃣ REGISTER USER ===" -ForegroundColor Yellow
$registerBody = @{
    email = "phase3-test@test.com"
    password = "Phase3Pass123!"
    first_name = "Phase3"
    last_name = "Test"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $registerBody

$userData = $registerResponse.Content | ConvertFrom-Json
$token = $userData.data.tokens.access_token
Write-Host "✅ Registered: $($userData.data.user.email)"

# 2️⃣ CREATE TEMPLATES
Write-Host "`n=== 2️⃣ CREATE TEMPLATES ===" -ForegroundColor Yellow
$createBody1 = @{
    name = "Simple Template"
    description = "A basic template"
    data = @{ company = "Test Corp" }
} | ConvertTo-Json

$createResponse1 = Invoke-WebRequest -Uri "http://localhost:3000/api/templates" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $createBody1

$template1 = $createResponse1.Content | ConvertFrom-Json
$templateId1 = $template1.data.template.id
Write-Host "✅ Template 1 created: $($template1.data.template.name)"

$createBody2 = @{
    name = "Extended Template"
    description = "A more complex template"
    data = @{ 
        sections = @(
            @{ title = "Section 1"; fields = @("field1") },
            @{ title = "Section 2"; fields = @("field2") }
        )
    }
} | ConvertTo-Json -Depth 5

$createResponse2 = Invoke-WebRequest -Uri "http://localhost:3000/api/templates" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $createBody2

$template2 = $createResponse2.Content | ConvertFrom-Json
$templateId2 = $template2.data.template.id
Write-Host "✅ Template 2 created: $($template2.data.template.name)"

# 3️⃣ GET LIST
Write-Host "`n=== 3️⃣ GET TEMPLATES LIST ===" -ForegroundColor Yellow
$listResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/templates?limit=10&offset=0" `
  -Headers @{"Authorization"="Bearer $token"}

$listData = $listResponse.Content | ConvertFrom-Json
Write-Host "✅ Total templates: $($listData.data.pagination.total)"
$listData.data.templates | ForEach-Object { Write-Host "  📋 $($_.name)" }

# 4️⃣ GET SINGLE
Write-Host "`n=== 4️⃣ GET SINGLE TEMPLATE ===" -ForegroundColor Yellow
$getResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/templates/$templateId1" `
  -Headers @{"Authorization"="Bearer $token"}

$getTemplate = $getResponse.Content | ConvertFrom-Json
Write-Host "✅ Retrieved: $($getTemplate.data.template.name)"

# 5️⃣ UPDATE
Write-Host "`n=== 5️⃣ UPDATE TEMPLATE ===" -ForegroundColor Yellow
$updateBody = @{
    name = "Updated Simple Template"
    description = "Updated description"
} | ConvertTo-Json

$updateResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/templates/$templateId1" `
  -Method PUT `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $updateBody

$updatedTemplate = $updateResponse.Content | ConvertFrom-Json
Write-Host "✅ Updated: $($updatedTemplate.data.template.name)"

# 6️⃣ DELETE
Write-Host "`n=== 6️⃣ DELETE TEMPLATE ===" -ForegroundColor Yellow
$deleteResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/templates/$templateId2" `
  -Method DELETE `
  -Headers @{"Authorization"="Bearer $token"}

$deleteResult = $deleteResponse.Content | ConvertFrom-Json
Write-Host "✅ Deleted template: $($deleteResult.data.id)"

# 7️⃣ VERIFY DELETION
Write-Host "`n=== 7️⃣ VERIFY DELETION ===" -ForegroundColor Yellow
$verifyResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/templates?limit=100" `
  -Headers @{"Authorization"="Bearer $token"}

$verifyData = $verifyResponse.Content | ConvertFrom-Json
Write-Host "✅ Remaining templates: $($verifyData.data.pagination.total)"

Write-Host "`n✅ PHASE 3 TESTING COMPLETE!" -ForegroundColor Green
```

---

## 🎓 Важные моменты

### 🔑 Всегда передавайте Authorization header
```powershell
# ✅ ПРАВИЛЬНО
-Headers @{"Authorization"="Bearer $token"}

# ❌ НЕПРАВИЛЬНО (запрос без токена)
-Headers @{}
```

### 🔍 Проверяйте status code
```powershell
# 201 Created — успешно создано
# 200 OK — успешно обновлено/получено
# 204 No Content — успешно удалено
# 400 Bad Request — ошибка валидации
# 401 Unauthorized — проблемы с аутентификацией
# 404 Not Found — ресурс не существует
# 500 Server Error — внутренняя ошибка
```

### 📦 JSONB данные
```powershell
# data может быть любым JSON объектом
$data = @{
    custom_field = "value"
    nested = @{
        field1 = "value1"
        field2 = @(1, 2, 3)
    }
    array = @("item1", "item2")
}
```

---

**Happy Testing! 🚀**
