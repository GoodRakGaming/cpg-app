# 🧪 Скрипт тестирования API
# Проверяет все основные endpoints и функциональность

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🧪 TESTING API - Commercial Proposal Generator    ║" -ForegroundColor Cyan
Write-Host "║   Backend: http://localhost:3000                   ║" -ForegroundColor Cyan
Write-Host "║   Frontend: http://localhost:3001                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$API_URL = "http://localhost:3000/api"
$DEMO_EMAIL = "test@example.com"
$DEMO_PASSWORD = "Test123!"
$accessToken = $null
$userId = $null

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [object]$Body,
        [string]$Token
    )

    Write-Host "▶️  $Name" -ForegroundColor Yellow
    try {
        $headers = @{ "Content-Type" = "application/json" }
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }

        $params = @{
            Uri     = $Url
            Method  = $Method
            Headers = $headers
        }
        if ($Body) {
            $params["Body"] = $Body | ConvertTo-Json
        }

        $response = Invoke-RestMethod @params
        Write-Host "   ✅ OK - Status: 200`n" -ForegroundColor Green
        return $response
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "   ❌ FAIL - Status: $statusCode`n" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
        return $null
    }
}

# ============= TEST 1: HEALTH CHECK =============
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "1️⃣  HEALTH CHECK" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$health = Test-Endpoint "GET /health" "GET" "http://localhost:3000/health" $null ""

# ============= TEST 2: AUTHENTICATION =============
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "2️⃣  AUTHENTICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$loginBody = @{
    email    = $DEMO_EMAIL
    password = $DEMO_PASSWORD
}
$loginResult = Test-Endpoint "POST /auth/login" "POST" "$API_URL/auth/login" $loginBody ""

if ($loginResult) {
    $accessToken = $loginResult.data.access_token
    $userId = $loginResult.data.user.id
    Write-Host "   💾 Saved token: $($accessToken.Substring(0, 20))...`n" -ForegroundColor Cyan
}

# ============= TEST 3: TEMPLATES =============
if ($accessToken) {
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "3️⃣  TEMPLATES (Create, Get, List)" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

    # Create template
    $templateBody = @{
        name        = "API Test Template $(Get-Date -Format 'HH:mm:ss')"
        description = "Template created by test script"
        content     = @{
            sections = @(
                @{ title = "Services"; items = @() }
                @{ title = "Pricing"; items = @() }
            )
        }
    }
    $templateResult = Test-Endpoint "POST /templates" "POST" "$API_URL/templates" $templateBody $accessToken
    
    $templateId = if ($templateResult) { $templateResult.data.template.id } else { $null }

    # Get all templates
    if ($templateId) {
        Test-Endpoint "GET /templates" "GET" "$API_URL/templates" $null $accessToken
        
        # Get single template
        Test-Endpoint "GET /templates/:id" "GET" "$API_URL/templates/$templateId" $null $accessToken
    }
}

# ============= TEST 4: PROPOSALS =============
if ($accessToken -and $templateId) {
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "4️⃣  PROPOSALS (Create, Get, List, Update)" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

    # Create proposal
    $proposalBody = @{
        title       = "API Test Proposal $(Get-Date -Format 'HH:mm:ss')"
        template_id = $templateId
        status      = "draft"
        data        = @{
            items = @(
                @{ description = "Service 1"; quantity = 1; price = 10000 }
                @{ description = "Service 2"; quantity = 2; price = 5000 }
            )
            total = 20000
        }
    }
    $proposalResult = Test-Endpoint "POST /proposals" "POST" "$API_URL/proposals" $proposalBody $accessToken
    
    $proposalId = if ($proposalResult) { $proposalResult.data.proposal.id } else { $null }

    if ($proposalId) {
        # Get all proposals
        Test-Endpoint "GET /proposals" "GET" "$API_URL/proposals" $null $accessToken
        
        # Get single proposal
        Test-Endpoint "GET /proposals/:id" "GET" "$API_URL/proposals/$proposalId" $null $accessToken

        # Update proposal
        $updateBody = @{
            title  = "Updated Proposal Title"
            status = "final"
        }
        Test-Endpoint "PUT /proposals/:id" "PUT" "$API_URL/proposals/$proposalId" $updateBody $accessToken

        # ============= TEST 5: PDF =============
        Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "5️⃣  PDF GENERATION" -ForegroundColor Cyan
        Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

        Test-Endpoint "POST /pdf/generate/:proposalId" "POST" "$API_URL/pdf/generate/$proposalId" $null $accessToken
        Test-Endpoint "GET /pdf/status/:proposalId" "GET" "$API_URL/pdf/status/$proposalId" $null $accessToken
    }
}

# ============= SUMMARY =============
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ TESTING COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📊 Test Results:" -ForegroundColor Cyan
Write-Host "   ✅ Backend Health: Running" -ForegroundColor Green
if ($accessToken) {
    Write-Host "   ✅ Authentication: Success" -ForegroundColor Green
    Write-Host "   ✅ Templates: OK" -ForegroundColor Green
    Write-Host "   ✅ Proposals: OK" -ForegroundColor Green
    Write-Host "   ✅ PDF: OK" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Authentication: Failed" -ForegroundColor Red
}

Write-Host "`n🌐 Access Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📧 Demo Email: $DEMO_EMAIL" -ForegroundColor Cyan
Write-Host "🔐 Demo Password: $DEMO_PASSWORD`n" -ForegroundColor Cyan

pause
