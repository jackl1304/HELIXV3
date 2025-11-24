# HELIX - Kompletter Start für Windows
# Startet alle Datenbanken und Services

Write-Host "🚀 HELIX Regulatory Intelligence - Kompletter Start" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Prüfe Docker
Write-Host "📦 Prüfe Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "✅ Docker gefunden: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker nicht gefunden! Bitte Docker Desktop installieren und starten." -ForegroundColor Red
    Write-Host "   Download: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Prüfe ob Docker läuft
try {
    docker ps 2>&1 | Out-Null
    Write-Host "✅ Docker läuft" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker läuft nicht! Bitte Docker Desktop starten." -ForegroundColor Red
    Write-Host "   Starten Sie Docker Desktop und versuchen Sie es erneut." -ForegroundColor Yellow
    exit 1
}

# Wechsle ins Projektverzeichnis
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# 1. Starte Datenbanken (PostgreSQL + Redis)
Write-Host "`n🗄️  Starte Datenbanken (PostgreSQL + Redis)..." -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Fehler beim Starten der Datenbanken!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Datenbanken gestartet" -ForegroundColor Green
Write-Host "   PostgreSQL: localhost:5432" -ForegroundColor Gray
Write-Host "   Redis: localhost:6379`n" -ForegroundColor Gray

# Warte bis Datenbanken bereit sind
Write-Host "⏳ Warte auf Datenbanken..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 2. Setze Umgebungsvariablen
Write-Host "`n🔧 Konfiguriere Umgebungsvariablen..." -ForegroundColor Cyan

$env:NODE_ENV = "development"
$env:PORT = "5000"
$env:DATABASE_URL = "postgresql://helix_user:helix_password@localhost:5432/helix_regulatory"

# API Keys (ersetzen Sie diese mit Ihren echten Keys)
# Für Entwicklung können Sie Platzhalter verwenden
if (-not $env:OPENAI_API_KEY) {
    Write-Host "⚠️  OPENAI_API_KEY nicht gesetzt (optional für Entwicklung)" -ForegroundColor Yellow
    $env:OPENAI_API_KEY = "your-openai-key-here"
}

if (-not $env:ANTHROPIC_API_KEY) {
    Write-Host "⚠️  ANTHROPIC_API_KEY nicht gesetzt (optional für Entwicklung)" -ForegroundColor Yellow
    $env:ANTHROPIC_API_KEY = "your-anthropic-key-here"
}

if (-not $env:SESSION_SECRET) {
    $env:SESSION_SECRET = "helix-development-secret-key-change-in-production-min-32-chars"
}

Write-Host "✅ Umgebungsvariablen gesetzt" -ForegroundColor Green

# 3. Initialisiere Datenbank-Schema
Write-Host "`n📊 Initialisiere Datenbank-Schema..." -ForegroundColor Cyan
npm run db:push

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Datenbank-Schema konnte nicht initialisiert werden (möglicherweise bereits vorhanden)" -ForegroundColor Yellow
}

# 4. Starte Backend und Frontend
Write-Host "`n🚀 Starte Backend und Frontend..." -ForegroundColor Cyan
Write-Host "   Das Projekt wird jetzt gestartet..." -ForegroundColor Gray
Write-Host "   Öffnen Sie http://localhost:5000 im Browser`n" -ForegroundColor Yellow

npm run dev



