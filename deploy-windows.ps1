# Helix Windows Deployment Script
# Führt komplettes Deployment von Windows aus durch

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 HELIX WINDOWS DEPLOYMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$SERVER = "152.53.191.99"
$USER = "root"
$REMOTE_DIR = "/opt/helix"

# 1. Build lokal
Write-Host "📦 Building locally..." -ForegroundColor Yellow
npm run build
if (-not (Test-Path "dist/index.js")) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# 2. Archive erstellen (nur existierende Dateien)
Write-Host "📦 Creating archive..." -ForegroundColor Yellow
$filesToPack = @(
    "dist",
    "package.json",
    "package-lock.json",
    "shared",
    "scripts",
    "migrations",
    "drizzle.config.ts"
)

$existingFiles = $filesToPack | Where-Object { Test-Path $_ }
if ($existingFiles.Count -eq 0) {
    Write-Host "❌ No files to pack!" -ForegroundColor Red
    exit 1
}

tar czf helix-win.tar.gz $existingFiles
if (-not (Test-Path "helix-win.tar.gz")) {
    Write-Host "❌ Archive creation failed" -ForegroundColor Red
    exit 1
}

# 3. Upload
Write-Host "📤 Uploading to server..." -ForegroundColor Yellow
scp helix-win.tar.gz "${USER}@${SERVER}:/tmp/"

# 4. Server-Setup
Write-Host "🔧 Setting up on server..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" @"
set -e
cd /opt/helix
echo '📦 Extracting...'
tar xzf /tmp/helix-win.tar.gz
echo '📦 Installing dependencies...'
npm install --production
echo '🔨 Building import scripts...'
npx esbuild scripts/script-db.ts scripts/import-fda-510k.ts scripts/import-ema-news.ts scripts/import-who-guidance.ts scripts/import-mhra-updates.ts scripts/import-healthcanada-notices.ts scripts/import-tga-updates.ts scripts/import-pmda-announcements.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/import-scripts
echo '✅ Build complete'
ls -lh dist/import-scripts/
echo '🔄 Restarting service...'
export AUTO_SEED=1
export IMPORT_INTERVAL_MINUTES=30
export FORCE_IMPORT=1
pm2 restart helix-api --update-env
sleep 5
echo '📊 Service status:'
pm2 list
echo '📊 Health check:'
curl -s http://localhost:5000/health | head -10
echo ''
echo '📊 Import status:'
curl -s http://localhost:5000/api/source-import/status
"@

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🌐 http://www.deltaways-helix.de" -ForegroundColor White
Write-Host "📊 http://152.53.191.99:5000/api/source-import/status" -ForegroundColor White
Write-Host ""
Write-Host "Check logs with: ssh root@152.53.191.99 'pm2 logs helix-api'" -ForegroundColor Gray
