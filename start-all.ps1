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
Start-Sleep -Seconds 2

# Запуск Frontend в новом окне
Write-Host "2️⃣  Запуск Frontend (порт 3001)..." -ForegroundColor Cyan
Start-Process powershell.exe -ArgumentList "-NoExit -Command cd '$ProjectRoot'; & '.\start-frontend.ps1'"
Start-Sleep -Seconds 1

Write-Host "`n✅ Оба сервера запущены!" -ForegroundColor Green
Write-Host "`n📱 Откройте в браузере: http://localhost:3001" -ForegroundColor Cyan
Write-Host "`n📝 Демо-учетные данные:" -ForegroundColor Yellow
Write-Host "   Email: test@example.com" -ForegroundColor Gray
Write-Host "   Password: Test123!" -ForegroundColor Gray
Write-Host "`n⏹️  Для остановки закройте оба PowerShell окна`n" -ForegroundColor Yellow
