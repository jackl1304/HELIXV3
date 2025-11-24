#!/bin/bash
# Helix Netcup Deployment Script (schnell & fokussiert)
# Erstellt optimierte Production-Builds und transferiert zu Server via SFTP

set -e

SERVER="152.53.191.99"
USER="root"
REMOTE_DIR="/opt/helix"
LOCAL_ARCHIVE="helix-deploy.tar.gz"

echo "═══════════════════════════════════════════════"
echo "🚀 HELIX DEPLOYMENT SCRIPT"
echo "═══════════════════════════════════════════════"
echo ""

# 1. Local Build
echo "📦 Building production artifacts..."
npm run build
if [ ! -f "dist/index.js" ]; then
  echo "❌ Build failed - dist/index.js missing"
  exit 1
fi
echo "✅ Build complete"
echo ""

# 2. Package
echo "📦 Creating deployment archive..."
tar czf "$LOCAL_ARCHIVE" \
  dist/ \
  package.json \
  package-lock.json \
  shared/ \
  migrations/ \
  drizzle.config.ts \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=attached_assets
echo "✅ Archive created: $LOCAL_ARCHIVE"
echo ""

# 3. Transfer
echo "📤 Uploading to $SERVER..."
scp "$LOCAL_ARCHIVE" "$USER@$SERVER:/tmp/"
echo "✅ Upload complete"
echo ""

# 4. Remote extraction & restart
echo "🔧 Extracting and restarting on server..."
ssh "$USER@$SERVER" << 'ENDSSH'
cd /opt/helix
tar xzf /tmp/helix-deploy.tar.gz
npm install --production
export AUTO_SEED=1
export IMPORT_INTERVAL_MINUTES=30
pm2 restart helix-api --update-env
pm2 logs helix-api --lines 50
ENDSSH

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════"
echo "🌐 URL: http://www.deltaways-helix.de"
echo "🔍 Health: http://152.53.191.99:5000/health"
echo "📊 Import Status: http://152.53.191.99:5000/api/source-import/status"
echo ""
