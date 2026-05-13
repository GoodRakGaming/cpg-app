[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
# 🚀 Скрипт запуска Backend сервера
# Этот скрипт запускает Express.js сервер на порту 3000

Write-Host "`n╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    🚀 BACKEND SERVER (Express.js)         ║" -ForegroundColor Cyan
Write-Host "║    Port: 3000                             ║" -ForegroundColor Cyan
Write-Host "║    Database: PostgreSQL (proposal_gen)   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Проверка PostgreSQL подключения
Write-Host "🔍 Проверка PostgreSQL подключения..." -ForegroundColor Yellow
try {
    $pgCheck = pg_isready -h localhost 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL доступна`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL не запущена. Убедитесь, что служба PostgreSQL запущена.`n" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  pg_isready не найден, продолжаем запуск...`n" -ForegroundColor Yellow
}

# Переход в папку backend
Write-Host "📁 Переход в папку backend..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"

# Проверка node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 node_modules не найден, устанавливаю зависимости..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Запуск сервера
Write-Host "🔥 Запуск backend сервера..." -ForegroundColor Green
Write-Host "Доступные endpoints: http://localhost:3000/health`n" -ForegroundColor Cyan

npm run dev

# При остановке
Write-Host "`n❌ Backend сервер остановлен`n" -ForegroundColor Red
