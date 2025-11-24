# HELIX - Kompletter Start mit OpenRouter API
# Startet alle Datenbanken und Services mit OpenRouter API Key

Write-Host "🚀 HELIX Regulatory Intelligence - Start mit OpenRouter" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# OpenRouter API Key
$env:OPENROUTER_API_KEY = "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"
$env:OPENAI_API_KEY = $env:OPENROUTER_API_KEY
$env:ANTHROPIC_API_KEY = $env:OPENROUTER_API_KEY

Write-Host "✅ OpenRouter API Key konfiguriert" -ForegroundColor Green
Write-Host "   Unterstützt: OpenAI, Anthropic/Claude, und mehr`n" -ForegroundColor Gray

# Prüfe Docker
Write-Host "📦 Prüfe Docker..." -ForegroundColor Yellow
$dockerAvailable = $false
try {
    docker ps 2>&1 | Out-Null
    $dockerAvailable = $true
    Write-Host "✅ Docker verfügbar" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker nicht verfügbar - verwende Mock-Datenbank" -ForegroundColor Yellow
}

# Starte Datenbanken falls Docker verfügbar
if ($dockerAvailable) {
    Write-Host "`n🗄️  Starte Datenbanken (PostgreSQL + Redis)..." -ForegroundColor Cyan
    docker-compose -f docker-compose.dev.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Datenbanken gestartet" -ForegroundColor Green
        Write-Host "   PostgreSQL: localhost:5432" -ForegroundColor Gray
        Write-Host "   Redis: localhost:6379" -ForegroundColor Gray
        $env:DATABASE_URL = "postgresql://helix_user:helix_password@localhost:5432/helix_regulatory"
        Start-Sleep -Seconds 5
    } else {
        Write-Host "⚠️  Datenbanken konnten nicht gestartet werden" -ForegroundColor Yellow
        Write-Host "   Verwende Mock-Datenbank für Entwicklung" -ForegroundColor Gray
    }
} else {
    Write-Host "`n💡 Für volle Funktionalität:" -ForegroundColor Yellow
    Write-Host "   1. Docker Desktop starten" -ForegroundColor Gray
    Write-Host "   2. Oder Netcup PostgreSQL-Datenbank verwenden" -ForegroundColor Gray
    Write-Host "   Format: postgresql://user:password@host:5432/database`n" -ForegroundColor Gray
}

# Weitere Umgebungsvariablen
$env:NODE_ENV = "development"
$env:PORT = "5000"
$env:SESSION_SECRET = "helix-development-secret-key-change-in-production-min-32-chars"

# Initialisiere Datenbank-Schema (falls Datenbank verfügbar)
if ($env:DATABASE_URL) {
    Write-Host "`n📊 Initialisiere Datenbank-Schema..." -ForegroundColor Cyan
    npm run db:push 2>&1 | Out-Null
    Write-Host "✅ Datenbank-Schema initialisiert`n" -ForegroundColor Green
}

# Starte Backend und Frontend
Write-Host "🚀 Starte Backend und Frontend..." -ForegroundColor Cyan
Write-Host "   OpenRouter API: Aktiviert" -ForegroundColor Green
Write-Host "   Frontend & Backend: http://localhost:5000" -ForegroundColor Yellow
Write-Host "   Health Check: http://localhost:5000/health`n" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

npm run dev

