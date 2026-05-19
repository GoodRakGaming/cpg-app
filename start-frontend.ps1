[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
# 🚀 Скрипт запуска Frontend сервера
# Этот скрипт запускает Next.js сервер на порту 3001

Write-Host "`n╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    🚀 FRONTEND SERVER (Next.js)           ║" -ForegroundColor Cyan
Write-Host "║    Port: 3001                             ║" -ForegroundColor Cyan
Write-Host "║    Backend API: http://localhost:3000/api║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ⚠️ ВАЖНО: Установить PORT ДО запуска Next.js
$env:PORT = "3001"
Write-Host "🔧 PORT установлен на: $($env:PORT)`n" -ForegroundColor Cyan

# Переход в папку frontend
Write-Host "📁 Переход в папку frontend..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\frontend"

# Проверка node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 node_modules не найден, устанавливаю зависимости..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Проверка .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local не найден, создаю конфигурацию..." -ForegroundColor Yellow
    @"
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
PORT=3001
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ .env.local создан`n" -ForegroundColor Green
}

# Запуск сервера
Write-Host "🔥 Запуск frontend сервера..." -ForegroundColor Green
Write-Host "🌐 Откройте: http://localhost:3001`n" -ForegroundColor Cyan
Write-Host "📝 Демо-учетные данные:`n" -ForegroundColor Yellow
Write-Host "   Email: test@example.com`n   Password: Test123!`n" -ForegroundColor Gray

npm run dev

# При остановке
Write-Host "`n❌ Frontend сервер остановлен`n" -ForegroundColor Red
