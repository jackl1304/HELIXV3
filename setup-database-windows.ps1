# HELIX - Datenbank Setup für Windows
# Unterstützt: Docker, lokale PostgreSQL, oder Cloud-Datenbank

Write-Host "🚀 HELIX - Datenbank Setup" -ForegroundColor Cyan
Write-Host "=========================`n" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Prüfe Docker
$dockerAvailable = $false
try {
    docker ps 2>&1 | Out-Null
    $dockerAvailable = $true
    Write-Host "✅ Docker verfügbar" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker nicht verfügbar" -ForegroundColor Yellow
}

if ($dockerAvailable) {
    Write-Host "`n📦 Starte Datenbanken mit Docker..." -ForegroundColor Cyan
    docker-compose -f docker-compose.dev.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Datenbanken gestartet!" -ForegroundColor Green
        Write-Host "   PostgreSQL: localhost:5432" -ForegroundColor Gray
        Write-Host "   Redis: localhost:6379" -ForegroundColor Gray
        $env:DATABASE_URL = "postgresql://helix_user:helix_password@localhost:5432/helix_regulatory"
    } else {
        Write-Host "❌ Fehler beim Starten der Datenbanken" -ForegroundColor Red
        $dockerAvailable = $false
    }
}

if (-not $dockerAvailable) {
    Write-Host "`n💡 Alternative Optionen:" -ForegroundColor Yellow
    Write-Host "   1. Docker Desktop starten und Skript erneut ausführen" -ForegroundColor Gray
    Write-Host "   2. Lokale PostgreSQL installieren und konfigurieren" -ForegroundColor Gray
    Write-Host "   3. Cloud-Datenbank verwenden (z.B. Neon, Supabase, Netcup-DB)" -ForegroundColor Gray
    Write-Host "`n   Für Netcup: Verwenden Sie Ihre Netcup PostgreSQL-Datenbank" -ForegroundColor Cyan
    Write-Host "   Format: postgresql://user:password@host:5432/database`n" -ForegroundColor Gray
    
    $dbUrl = Read-Host "Geben Sie Ihre DATABASE_URL ein (oder Enter für Mock-DB)"
    if ($dbUrl) {
        $env:DATABASE_URL = $dbUrl
        Write-Host "✅ DATABASE_URL gesetzt" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Verwende Mock-Datenbank für Entwicklung" -ForegroundColor Yellow
    }
}

# Warte auf Datenbank
if ($dockerAvailable) {
    Write-Host "`n⏳ Warte auf Datenbank-Bereitschaft..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host "`n✅ Setup abgeschlossen!" -ForegroundColor Green




