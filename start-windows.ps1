# Windows PowerShell Start-Skript für HELIX
# Startet Backend und Frontend zusammen

Write-Host "🚀 HELIX Regulatory Intelligence System - Windows Start" -ForegroundColor Cyan
Write-Host ""

# Umgebungsvariablen setzen
$env:NODE_ENV = "development"
$env:PORT = "5000"

# DATABASE_URL setzen (falls nicht bereits gesetzt)
if (-not $env:DATABASE_URL) {
    Write-Host "⚠️  DATABASE_URL nicht gesetzt!" -ForegroundColor Yellow
    Write-Host "📝 Bitte setzen Sie DATABASE_URL in der Umgebung oder hier:" -ForegroundColor Yellow
    Write-Host "   Beispiel: `$env:DATABASE_URL='postgresql://user:pass@host:5432/db'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Für lokale Entwicklung können Sie eine kostenlose Neon-Datenbank verwenden:" -ForegroundColor Cyan
    Write-Host "   https://neon.tech - Kostenlose PostgreSQL-Datenbank" -ForegroundColor Cyan
    Write-Host ""
    
    # Versuche mit einer Standard-URL (wird wahrscheinlich fehlschlagen, aber zeigt den Fehler)
    $env:DATABASE_URL = "postgresql://localhost:5432/helix_dev"
    Write-Host "⚠️  Verwende Standard-DATABASE_URL (wird wahrscheinlich fehlschlagen)" -ForegroundColor Yellow
}

# Session Secret setzen (falls nicht gesetzt)
if (-not $env:SESSION_SECRET) {
    $env:SESSION_SECRET = "helix-development-secret-key-change-in-production-min-32-chars"
}

Write-Host "✅ Umgebungsvariablen konfiguriert" -ForegroundColor Green
Write-Host "   NODE_ENV: $env:NODE_ENV" -ForegroundColor Gray
Write-Host "   PORT: $env:PORT" -ForegroundColor Gray
Write-Host "   DATABASE_URL: $($env:DATABASE_URL.Substring(0, [Math]::Min(50, $env:DATABASE_URL.Length)))..." -ForegroundColor Gray
Write-Host ""

# In das Projektverzeichnis wechseln
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "📦 Starte Development Server (Backend + Frontend)..." -ForegroundColor Cyan
Write-Host ""

# Starte npm run dev
npm run dev



