# 🧪 API Testing Guide — Фаза 2

## PowerShell Примеры для тестирования API

### 1️⃣ РЕГИСТРАЦИЯ

```powershell
# Регистрация нового пользователя
$body = @{
    email = "testuser@example.com"
    password = "SecurePassword123!"
    first_name = "Иван"
    last_name = "Иванов"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3

# Сохранить tokens
$registerData = $response.Content | ConvertFrom-Json
$env:ACCESS_TOKEN = $registerData.data.tokens.access_token
$env:REFRESH_TOKEN = $registerData.data.tokens.refresh_token
$env:USER_ID = $registerData.data.user.id
```

---

### 2️⃣ ЛОГИН

```powershell
# Логин с сохранением cookies
$body = @{
    email = "testuser@example.com"
    password = "SecurePassword123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -SessionVariable web

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3

# Сохранить новый access token
$loginData = $response.Content | ConvertFrom-Json
$env:ACCESS_TOKEN = $loginData.data.access_token
```

---

### 3️⃣ ОБНОВЛЕНИЕ ТОКЕНА

```powershell
# Обновить access token используя refresh token
$body = @{
    refresh_token = $env:REFRESH_TOKEN
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/refresh" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -WebSession $web

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3

# Обновить environment variable
$refreshData = $response.Content | ConvertFrom-Json
$env:ACCESS_TOKEN = $refreshData.data.access_token
```

---

### 4️⃣ ЛОГАУТ

```powershell
# Логаут (очищает refresh token cookie)
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/logout" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -WebSession $web

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

---

## 🛡️ ИСПОЛЬЗОВАНИЕ ACCESS TOKEN В ЗАЩИЩЁННЫХ МАРШРУТАХ

```powershell
# Использовать access token в Authorization header
Invoke-WebRequest -Uri "http://localhost:3000/api/protected-route" `
  -Headers @{"Authorization"="Bearer $env:ACCESS_TOKEN"}
```

---

## ❌ ТЕСТИРОВАНИЕ ОШИБОК

### Ошибка 1: Слабый пароль

```powershell
$body = @{
    email = "user@example.com"
    password = "weak"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -ErrorAction Ignore 2>&1
```

**Ожидаемый результат (400):**
```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Пароль должен быть не менее 8 символов"
  }
}
```

---

### Ошибка 2: Некорректный email

```powershell
$body = @{
    email = "not-an-email"
    password = "SecurePassword123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -ErrorAction Ignore 2>&1
```

**Ожидаемый результат (400):**
```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Некорректный email адрес"
  }
}
```

---

### Ошибка 3: Дублирование email

```powershell
# Попытка регистрации с существующим email
$body = @{
    email = "testuser@example.com"
    password = "SecurePassword123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -ErrorAction Ignore 2>&1
```

**Ожидаемый результат (409):**
```json
{
  "success": false,
  "error": {
    "status": 409,
    "message": "Пользователь с таким email уже зарегистрирован"
  }
}
```

---

### Ошибка 4: Неверный пароль

```powershell
$body = @{
    email = "testuser@example.com"
    password = "WrongPassword123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -ErrorAction Ignore 2>&1
```

**Ожидаемый результат (401):**
```json
{
  "success": false,
  "error": {
    "status": 401,
    "message": "Неверный email или пароль"
  }
}
```

---

## 🔑 ТЕСТИРОВАНИЕ TOKEN VALIDATION

### Проверка валидного token

```powershell
$headers = @{
    "Authorization" = "Bearer $env:ACCESS_TOKEN"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/protected" `
  -Headers $headers
```

---

### Проверка невалидного token

```powershell
$invalidToken = "invalid.token.here"

$headers = @{
    "Authorization" = "Bearer $invalidToken"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/protected" `
  -Headers $headers `
  -ErrorAction Ignore 2>&1
```

**Ожидаемый результат (401):**
```json
{
  "success": false,
  "error": {
    "status": 401,
    "message": "Invalid token"
  }
}
```

---

## 📊 ПОЛНЫЙ WORKFLOW (Copy-Paste готово)

```powershell
# 1️⃣ РЕГИСТРАЦИЯ
Write-Host "=== 1️⃣ РЕГИСТРАЦИЯ ===" -ForegroundColor Cyan
$body = '{"email":"workflow@test.com","password":"TestPass123!","first_name":"Test","last_name":"User"}' 
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
$registerData = $response.Content | ConvertFrom-Json
$env:TOKEN = $registerData.data.tokens.access_token
Write-Host "✅ User ID: $($registerData.data.user.id)"
Write-Host "✅ Access Token: $($env:TOKEN.Substring(0,30))..."

# 2️⃣ ЛОГИН
Write-Host "`n=== 2️⃣ ЛОГИН ===" -ForegroundColor Cyan
$body = '{"email":"workflow@test.com","password":"TestPass123!"}'
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
$loginData = $response.Content | ConvertFrom-Json
Write-Host "✅ Login success"
Write-Host "✅ New Access Token: $($loginData.data.access_token.Substring(0,30))..."

# 3️⃣ HEALTH CHECK с Authorization
Write-Host "`n=== 3️⃣ HEALTH CHECK с TOKEN ===" -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:3000/health" `
  -Headers @{"Authorization"="Bearer $env:TOKEN"}
$healthData = $response.Content | ConvertFrom-Json
Write-Host "✅ Status: $($healthData.status)"
Write-Host "✅ Message: $($healthData.message)"

# 4️⃣ ЛОГАУТ
Write-Host "`n=== 4️⃣ ЛОГАУТ ===" -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/logout" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"}
Write-Host "✅ Logged out successfully"

Write-Host "`n✅ Полный workflow завершён!" -ForegroundColor Green
```

---

## 💾 СОХРАНЕНИЕ ПЕРЕМЕННЫХ МЕЖДУ СЕССИЯМИ

```powershell
# Сохранить переменные в файл
@{
    ACCESS_TOKEN = $env:ACCESS_TOKEN
    REFRESH_TOKEN = $env:REFRESH_TOKEN
    USER_ID = $env:USER_ID
} | ConvertTo-Json | Out-File -FilePath "tokens.json"

# Загрузить переменные из файла
$tokens = Get-Content "tokens.json" | ConvertFrom-Json
$env:ACCESS_TOKEN = $tokens.ACCESS_TOKEN
$env:REFRESH_TOKEN = $tokens.REFRESH_TOKEN
$env:USER_ID = $tokens.USER_ID
```

---

## 📋 РЕКОМЕНДУЕМЫЕ ТЕСТЫ ПЕРЕД DEVELOPMENT

```powershell
# Быстрая проверка всех endpoints
$tests = @(
    @{
        name = "Health"
        uri = "http://localhost:3000/health"
        method = "GET"
    },
    @{
        name = "Register"
        uri = "http://localhost:3000/api/auth/register"
        method = "POST"
        body = '{"email":"test@test.com","password":"Test123456"}'
    },
    @{
        name = "Login"
        uri = "http://localhost:3000/api/auth/login"
        method = "POST"
        body = '{"email":"test@test.com","password":"Test123456"}'
    }
)

foreach ($test in $tests) {
    try {
        $params = @{
            Uri = $test.uri
            Method = $test.method
            Headers = @{"Content-Type"="application/json"}
        }
        if ($test.body) { $params.Body = $test.body }
        
        $response = Invoke-WebRequest @params
        Write-Host "✅ $($test.name)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($test.name): $_" -ForegroundColor Red
    }
}
```

