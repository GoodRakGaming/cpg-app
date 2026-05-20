[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
# 🚀 Скрипт запуска ВСЕХ компонентов проекта
# Запускает Backend (3000) и Frontend (3001) в отдельных PowerShell окнах

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🎬 ЗАПУСК ПОЛНОГО ПРОЕКТА                         ║" -ForegroundColor Cyan
Write-Host "║   Backend:  http://localhost:3000                   ║" -ForegroundColor Cyan
Write-Host "║   Frontend: http://localhost:3001                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$ProjectRoot = $PSScriptRoot

# Проверка PostgreSQL
Write-Host "🔍 Проверка требований..." -ForegroundColor Yellow
try {
    $pgCheck = pg_isready -h localhost 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL: НЕ ЗАПУЩЕНА" -ForegroundColor Red
        Write-Host "   Включите PostgreSQL в Services (services.msc) перед запуском!`n" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "⚠️  PostgreSQL: проверка недоступна (pg_isready не найден)" -ForegroundColor Yellow
}

Write-Host "`n📋 Проверка файлов..." -ForegroundColor Cyan
$checks = @(
    @{ Path = "backend"; Name = "Backend" },
    @{ Path = "frontend"; Name = "Frontend" }
)

foreach ($check in $checks) {
    if (Test-Path (Join-Path $ProjectRoot $check.Path)) {
        Write-Host "✅ $($check.Name): найден" -ForegroundColor Green
    } else {
        Write-Host "❌ $($check.Name): НЕ НАЙДЕН" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🚀 Запуск серверов...`n" -ForegroundColor Green

# Запуск Backend в новом окне
Write-Host "1️⃣  Запуск Backend (порт 3000)..." -ForegroundColor Cyan
Start-Process powershell.exe -ArgumentList "-NoExit -Command cd '$ProjectRoot'; & '.\start-backend.ps1'"

# Ожидание инициализации Backend (setup-demo-data + Express startup)
Write-Host "⏳ Ожидание инициализации Backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Проверка что Backend готов
$backendReady = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -ErrorAction SilentlyContinue -TimeoutSec 1
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend готов к работе!" -ForegroundColor Green
            $backendReady = $true
            break
        }
    } catch {
        # Ждём дальше
        Start-Sleep -Seconds 1
    }
}

if (-not $backendReady) {
    Write-Host "⚠️  Backend может еще инициализироваться..." -ForegroundColor Yellow
}

# Запуск Frontend в новом окне (с явной передачей PORT)
Write-Host "`n2️⃣  Запуск Frontend (порт 3001)..." -ForegroundColor Cyan
$env:PORT = "3001"
Start-Process powershell.exe -ArgumentList "-NoExit -Command `$env:PORT='3001'; cd '$ProjectRoot'; & '.\start-frontend.ps1'"
Start-Sleep -Seconds 2

Write-Host "`n✅ Оба сервера запущены!" -ForegroundColor Green
Write-Host "`n📱 Откройте в браузере: http://localhost:3001" -ForegroundColor Cyan
Write-Host "`n📝 Демо-учетные данные:" -ForegroundColor Yellow
Write-Host "   Email: test@example.com" -ForegroundColor Gray
Write-Host "   Password: Test123!" -ForegroundColor Gray
Write-Host "`n✨ Функции для тестирования:" -ForegroundColor Cyan
Write-Host "   1. Регистрация новых пользователей (/register)" -ForegroundColor Gray
Write-Host "   2. Вход и управление предложениями (/proposals)" -ForegroundColor Gray
Write-Host "   3. Создание коммерческих предложений" -ForegroundColor Gray
Write-Host "   4. Генерация PDF из предложений" -ForegroundColor Gray
Write-Host "`n⏹️  Для остановки закройте оба PowerShell окна`n" -ForegroundColor Yellow
