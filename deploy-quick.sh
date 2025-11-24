#!/bin/bash
# Vereinfachtes Helix Deployment für Netcup
# Baut lokal nur Frontend+Server, Import-Scripts werden auf Server gebündelt

set -e

echo "═══════════════════════════════════════════════"
echo "🚀 HELIX QUICK DEPLOYMENT"
echo "═══════════════════════════════════════════════"

# 1. Lokaler Build (nur Basis)
echo "📦 Building core application..."
npx vite build --config vite.config.ts
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# 2. Package alles was nötig ist
echo "📦 Creating deployment package..."
tar czf helix-quick.tar.gz \
  dist/ \
  package.json \
  package-lock.json \
  shared/ \
  scripts/ \
  migrations/ \
  drizzle.config.ts \
  --exclude=node_modules \
  --exclude=.git

# 3. Upload
echo "📤 Uploading to server..."
scp helix-quick.tar.gz root@152.53.191.99:/tmp/

# 4. Server-seitige Installation
echo "🔧 Installing on server..."
ssh root@152.53.191.99 << 'ENDSSH'
set -e
cd /opt/helix
echo "Extracting..."
tar xzf /tmp/helix-quick.tar.gz
echo "Installing dependencies..."
npm install
echo "Building import scripts on server..."
npx esbuild scripts/script-db.ts scripts/import-fda-510k.ts scripts/import-ema-news.ts scripts/import-who-guidance.ts scripts/import-mhra-updates.ts scripts/import-healthcanada-notices.ts scripts/import-tga-updates.ts scripts/import-pmda-announcements.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/import-scripts
echo "Setting environment..."
export AUTO_SEED=1
export IMPORT_INTERVAL_MINUTES=30
export FORCE_IMPORT=1
echo "Restarting service..."
pm2 restart helix-api --update-env
sleep 3
echo "Checking status..."
pm2 list
curl -s http://localhost:5000/health | head -20
ENDSSH

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════"
echo "🌐 http://www.deltaways-helix.de"
echo "📊 http://152.53.191.99:5000/api/source-import/status"
