# HELIX - Start mit OpenRouter API
# Startet alles mit OpenRouter API Key

Write-Host "🚀 HELIX - Start mit OpenRouter API" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# OpenRouter API Key
$env:OPENROUTER_API_KEY = "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"
$env:OPENAI_API_KEY = $env:OPENROUTER_API_KEY

# Datenbank (versuche Docker, sonst Mock)
$env:DATABASE_URL = "postgresql://helix_user:helix_password@localhost:5432/helix_regulatory"

# Weitere Umgebungsvariablen
$env:NODE_ENV = "development"
$env:PORT = "5000"
$env:SESSION_SECRET = "helix-development-secret-key-change-in-production-min-32-chars"

Write-Host "✅ OpenRouter API Key konfiguriert" -ForegroundColor Green
Write-Host "✅ Umgebungsvariablen gesetzt" -ForegroundColor Green
Write-Host "`n🚀 Starte Backend und Frontend...`n" -ForegroundColor Cyan
Write-Host "🌐 Öffnen Sie http://localhost:5000 im Browser`n" -ForegroundColor Yellow

npm run dev

