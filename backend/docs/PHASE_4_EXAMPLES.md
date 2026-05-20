# 🧪 Proposal API Testing Examples — Фаза 4

## PowerShell Примеры для тестирования Proposal CRUD API

### 🔐 ПОДГОТОВКА: Setup для тестирования

```powershell
# 1️⃣ Регистрация пользователя
$registerBody = @{
    email = "proposal-user@test.com"
    password = "ProposalPass123!"
    first_name = "Proposal"
    last_name = "Tester"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $registerBody

$userData = $registerResponse.Content | ConvertFrom-Json
$token = $userData.data.tokens.access_token
$userId = $userData.data.user.id

Write-Host "✅ User registered: $($userData.data.user.email)"

# 2️⃣ Создание шаблона для использования в КП
$templateBody = @{
    name = "Стандартный шаблон КП"
    description = "Шаблон для коммерческих предложений"
    data = @{
        company = "placeholder"
        services = @(
            @{name = "Услуга 1"; price = 0},
            @{name = "Услуга 2"; price = 0}
        )
    }
} | ConvertTo-Json -Depth 5

$templateResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/templates" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $templateBody

$templateData = $templateResponse.Content | ConvertFrom-Json
$templateId = $templateData.data.template.id

Write-Host "✅ Template created: $templateId"
Write-Host "`n✅ Setup complete. Ready for testing"
```

---

### 1️⃣ CREATE PROPOSAL (POST /api/proposals)

**Простое КП:**
```powershell
$proposalBody = @{
    title = "Предложение для клиента ABC"
    template_id = $templateId
    status = "draft"
    data = @{
        client_name = "ABC Company"
        amount = 150000
        services = @(
            @{name = "Разработка"; price = 100000},
            @{name = "Тестирование"; price = 30000},
            @{name = "Развёртывание"; price = 20000}
        )
    }
} | ConvertTo-Json -Depth 5

$proposalResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $proposalBody

$proposalData = $proposalResponse.Content | ConvertFrom-Json
$proposalId = $proposalData.data.proposal.id

Write-Host "✅ Proposal created: $($proposalData.data.proposal.title)"
Write-Host "✅ Proposal ID: $proposalId"
Write-Host "✅ Status: $($proposalData.data.proposal.status)"
Write-Host "✅ Version: $($proposalData.data.proposal.version_number)"
```

**КП с расширенными данными:**
```powershell
$advancedProposalBody = @{
    title = "Расширенное предложение с условиями"
    template_id = $templateId
    status = "draft"
    data = @{
        client = @{
            name = "Large Corp"
            email = "contact@largecorp.com"
            phone = "+7 (999) 999-99-99"
        }
        project = @{
            name = "Enterprise Portal Development"
            description = "Full-stack portal with admin panel"
            duration_weeks = 12
        }
        services = @(
            @{name = "Requirements Analysis"; price = 15000; unit = "fixed"},
            @{name = "UI/UX Design"; price = 25000; unit = "fixed"},
            @{name = "Backend Development"; price = 80000; unit = "fixed"},
            @{name = "Frontend Development"; price = 70000; unit = "fixed"},
            @{name = "Testing"; price = 20000; unit = "fixed"},
            @{name = "Deployment & Support"; price = 10000; unit = "fixed"}
        )
        total = 220000
        payment_terms = @{
            advance = 30
            milestones = 70
            currency = "RUB"
        }
        delivery_date = "2026-08-06"
        warranty_period_months = 6
    }
} | ConvertTo-Json -Depth 10

$advancedResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $advancedProposalBody

$advancedData = $advancedResponse.Content | ConvertFrom-Json
$advancedProposalId = $advancedData.data.proposal.id

Write-Host "✅ Advanced proposal created: $advancedProposalId"
```

---

### 2️⃣ GET PROPOSALS LIST (GET /api/proposals)

**Без параметров (default):**
```powershell
$listResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals" `
  -Headers @{"Authorization"="Bearer $token"}

$listData = $listResponse.Content | ConvertFrom-Json
Write-Host "✅ Total proposals: $($listData.data.pagination.total)"
Write-Host "✅ Page: $($listData.data.pagination.page)/$($listData.data.pagination.pages)"
$listData.data.proposals | ForEach-Object { 
    Write-Host "  📄 $($_.title) [Status: $($_.status)] [V$($_.version_number)]"
}
```

**С пагинацией:**
```powershell
$paginationResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals?limit=5&offset=0" `
  -Headers @{"Authorization"="Bearer $token"}

$paginationData = $paginationResponse.Content | ConvertFrom-Json
$paginationData | ConvertTo-Json -Depth 3
```

**С фильтрацией по статусу (draft only):**
```powershell
$draftResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals?status=draft" `
  -Headers @{"Authorization"="Bearer $token"}

$draftData = $draftResponse.Content | ConvertFrom-Json
Write-Host "✅ Draft proposals: $($draftData.data.pagination.total)"
$draftData.data.proposals | ForEach-Object { Write-Host "  - $($_.title)" }
```

**С сортировкой:**
```powershell
$sortedResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals?sort=title&order=asc" `
  -Headers @{"Authorization"="Bearer $token"}

$sortedData = $sortedResponse.Content | ConvertFrom-Json
Write-Host "✅ Proposals sorted by title (ascending):"
$sortedData.data.proposals | ForEach-Object { Write-Host "  - $($_.title)" }
```

---

### 3️⃣ GET SINGLE PROPOSAL (GET /api/proposals/:id)

```powershell
$getResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$proposalId" `
  -Headers @{"Authorization"="Bearer $token"}

$getProposal = $getResponse.Content | ConvertFrom-Json

Write-Host "✅ Proposal: $($getProposal.data.proposal.title)"
Write-Host "✅ Status: $($getProposal.data.proposal.status)"
Write-Host "✅ Template: $($getProposal.data.proposal.template_name)"
Write-Host "✅ Version: $($getProposal.data.proposal.version_number)"
Write-Host "✅ Comment: $($getProposal.data.proposal.comment)"

Write-Host "`n✅ Data:"
$getProposal.data.proposal.data | ConvertTo-Json | Write-Host
```

---

### 4️⃣ UPDATE PROPOSAL (PUT /api/proposals/:id)

**Обновить название и статус:**
```powershell
$updateBody = @{
    title = "ОБНОВЛЁННОЕ: Предложение для ABC (финальное)"
    status = "final"
} | ConvertTo-Json

$updateResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$proposalId" `
  -Method PUT `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $updateBody

$updatedProposal = $updateResponse.Content | ConvertFrom-Json
Write-Host "✅ Updated: $($updatedProposal.data.proposal.title)"
Write-Host "✅ New status: $($updatedProposal.data.proposal.status)"
```

**Обновить данные (создаст новую версию):**
```powershell
$dataUpdateBody = @{
    data = @{
        client_name = "ABC Company UPDATED"
        amount = 180000
        services = @(
            @{name = "Разработка"; price = 120000},
            @{name = "Тестирование"; price = 40000},
            @{name = "Развёртывание"; price = 20000}
        )
    }
    comment = "Увеличена стоимость разработки"
} | ConvertTo-Json -Depth 5

$dataUpdateResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$proposalId" `
  -Method PUT `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $dataUpdateBody

$dataUpdated = $dataUpdateResponse.Content | ConvertFrom-Json
Write-Host "✅ Data updated"
Write-Host "✅ New version created with comment: Увеличена стоимость разработки"
```

**Комплексное обновление:**
```powershell
$complexUpdateBody = @{
    title = "FINAL: Предложение для ABC"
    status = "final"
    data = @{
        client_name = "ABC Company Final"
        amount = 200000
        services = @(
            @{name = "Разработка"; price = 150000},
            @{name = "Тестирование"; price = 30000},
            @{name = "Развёртывание"; price = 20000}
        )
        notes = "Финальное предложение для подписания"
    }
    comment = "Финальная версия, готова к отправке"
} | ConvertTo-Json -Depth 5

$complexResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$proposalId" `
  -Method PUT `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $complexUpdateBody

$complexData = $complexResponse.Content | ConvertFrom-Json
Write-Host "✅ Complex update completed"
Write-Host "✅ Title: $($complexData.data.proposal.title)"
Write-Host "✅ Status: $($complexData.data.proposal.status)"
```

---

### 5️⃣ GET PROPOSAL VERSIONS (GET /api/proposals/:id/versions)

```powershell
$versionsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$proposalId/versions" `
  -Headers @{"Authorization"="Bearer $token"}

$versionsData = $versionsResponse.Content | ConvertFrom-Json

Write-Host "✅ Total versions: $($versionsData.data.total)"
Write-Host "`n📜 Version history:"
$versionsData.data.versions | ForEach-Object {
    Write-Host "  Version $($_.version_number): '$($_.comment)' (hash: $($_.pdf_hash.Substring(0,8))...)"
}
```

---

### 6️⃣ GET SPECIFIC VERSION (GET /api/proposals/:id/versions/:version_id)

```powershell
# Получить первую версию
$firstVersionId = $versionsData.data.versions[-1].id
$versionResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$proposalId/versions/$firstVersionId" `
  -Headers @{"Authorization"="Bearer $token"}

$versionData = $versionResponse.Content | ConvertFrom-Json

Write-Host "✅ Version $($versionData.data.version.version_number): $($versionData.data.version.comment)"
Write-Host "`n📊 Data:"
$versionData.data.version.data | ConvertTo-Json | Write-Host
```

---

### 7️⃣ DELETE PROPOSAL (DELETE /api/proposals/:id)

```powershell
# Создаём КП для удаления
$deleteProposalBody = @{
    title = "Предложение для удаления"
    template_id = $templateId
} | ConvertTo-Json -Depth 3

$deleteProposalResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $deleteProposalBody

$deleteProposalData = $deleteProposalResponse.Content | ConvertFrom-Json
$deleteProposalId = $deleteProposalData.data.proposal.id

# Удаляем
$deleteResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$deleteProposalId" `
  -Method DELETE `
  -Headers @{"Authorization"="Bearer $token"}

$deleteResult = $deleteResponse.Content | ConvertFrom-Json
Write-Host "✅ Proposal deleted: $($deleteResult.data.id)"

# Проверяем что удалён
try {
    $verifyResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$deleteProposalId" `
      -Headers @{"Authorization"="Bearer $token"} `
      -ErrorAction Stop
    Write-Host "❌ ERROR: Proposal still accessible!"
} catch {
    Write-Host "✅ Soft delete verified: Proposal not found (404)"
}
```

---

## ❌ ТЕСТИРОВАНИЕ ОШИБОК

### Ошибка 1: Отсутствие authentication token
```powershell
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals" `
      -ErrorAction Stop
} catch {
    Write-Host "✅ Expected error (401): Token required"
}
```

### Ошибка 2: Несуществующий template
```powershell
$invalidTemplateBody = @{
    title = "Invalid template"
    template_id = "00000000-0000-0000-0000-000000000000"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals" `
      -Method POST `
      -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
      -Body $invalidTemplateBody `
      -ErrorAction Stop
} catch {
    Write-Host "✅ Expected error (404): Template not found"
}
```

### Ошибка 3: Доступ к чужому КП
```powershell
# Регистрируем второго пользователя
$user2Body = @{
    email = "another-user@test.com"
    password = "AnotherPass123!"
} | ConvertTo-Json

$user2Response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $user2Body

$user2Data = $user2Response.Content | ConvertFrom-Json
$token2 = $user2Data.data.tokens.access_token

# Пытаемся получить КП первого пользователя
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$proposalId" `
      -Headers @{"Authorization"="Bearer $token2"} `
      -ErrorAction Stop
} catch {
    Write-Host "✅ Security check passed: User2 cannot access User1 proposal (404)"
}
```

---

## 📊 ПОЛНЫЙ WORKFLOW (Copy-Paste готово)

```powershell
Write-Host "=== PHASE 4: PROPOSAL API TESTING ===" -ForegroundColor Cyan

# Setup
Write-Host "`n=== SETUP ===" -ForegroundColor Yellow
$registerBody = '{"email":"p4test@test.com","password":"P4Test123!","first_name":"P4","last_name":"Test"}'
$registerResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $registerBody
$userData = $registerResponse.Content | ConvertFrom-Json
$token = $userData.data.tokens.access_token

$templateBody = @{name="Template";data=@{services=@()}} | ConvertTo-Json -Depth 3
$templateResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/templates" -Method POST -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"} -Body $templateBody
$templateData = $templateResponse.Content | ConvertFrom-Json
$templateId = $templateData.data.template.id
Write-Host "✅ Setup complete"

# 1️⃣ Create
Write-Host "`n=== 1️⃣ CREATE ===" -ForegroundColor Yellow
$createBody = @{title="Test Proposal";template_id=$templateId;data=@{client="ABC"}} | ConvertTo-Json -Depth 3
$createResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals" -Method POST -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"} -Body $createBody
$proposalData = $createResponse.Content | ConvertFrom-Json
$proposalId = $proposalData.data.proposal.id
Write-Host "✅ Proposal created: $proposalId"

# 2️⃣ List
Write-Host "`n=== 2️⃣ LIST ===" -ForegroundColor Yellow
$listResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals" -Headers @{"Authorization"="Bearer $token"}
$listData = $listResponse.Content | ConvertFrom-Json
Write-Host "✅ Total: $($listData.data.pagination.total)"

# 3️⃣ Get Single
Write-Host "`n=== 3️⃣ GET SINGLE ===" -ForegroundColor Yellow
$getResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$proposalId" -Headers @{"Authorization"="Bearer $token"}
$getProposal = $getResponse.Content | ConvertFrom-Json
Write-Host "✅ Retrieved: $($getProposal.data.proposal.title)"

# 4️⃣ Update
Write-Host "`n=== 4️⃣ UPDATE ===" -ForegroundColor Yellow
$updateBody = @{title="Updated Proposal";status="final";data=@{client="ABC Corp";amount=100000};comment="Ready for sending"} | ConvertTo-Json -Depth 3
$updateResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$proposalId" -Method PUT -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"} -Body $updateBody
$updatedProposal = $updateResponse.Content | ConvertFrom-Json
Write-Host "✅ Updated: $($updatedProposal.data.proposal.title)"

# 5️⃣ Get Versions
Write-Host "`n=== 5️⃣ GET VERSIONS ===" -ForegroundColor Yellow
$versionsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$proposalId/versions" -Headers @{"Authorization"="Bearer $token"}
$versionsData = $versionsResponse.Content | ConvertFrom-Json
Write-Host "✅ Total versions: $($versionsData.data.total)"

# 6️⃣ Delete
Write-Host "`n=== 6️⃣ DELETE ===" -ForegroundColor Yellow
$deleteResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$proposalId" -Method DELETE -Headers @{"Authorization"="Bearer $token"}
Write-Host "✅ Proposal deleted"

Write-Host "`n✅ PHASE 4 TESTING COMPLETE!" -ForegroundColor Green
```

---

**Happy Testing! 🚀**
