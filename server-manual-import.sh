#!/bin/bash
# Manueller Import-Trigger auf Server
# Führt einen einzelnen Import-Zyklus aus

set -e

echo "═══════════════════════════════════════════════"
echo "🔄 MANUAL IMPORT CYCLE"
echo "═══════════════════════════════════════════════"

cd /opt/helix

# Environment laden
export $(pm2 env helix-api | grep DATABASE_URL | xargs)
if [ -z "$DATABASE_URL" ]; then
  if [ -f .env ]; then
    export $(cat .env | grep DATABASE_URL | xargs)
  fi
fi

echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
echo ""

# Prüfe ob gebündelte Scripts vorhanden
if [ -d "dist/import-scripts" ] && [ -f "dist/import-scripts/import-fda-510k.js" ]; then
  echo "✅ Using bundled scripts from dist/import-scripts/"

  for script in dist/import-scripts/import-*.js; do
    name=$(basename "$script" .js)
    echo "▶ Running $name..."
    node "$script" || echo "⚠️ $name failed"
  done

elif [ -d "scripts" ] && [ -f "scripts/import-fda-510k.ts" ]; then
  echo "✅ Using TypeScript scripts with tsx"

  npx tsx scripts/import-fda-510k.ts --limit=20 || echo "⚠️ FDA failed"
  npx tsx scripts/import-ema-news.ts --limit=15 || echo "⚠️ EMA failed"
  npx tsx scripts/import-who-guidance.ts || echo "⚠️ WHO failed"
  npx tsx scripts/import-mhra-updates.ts || echo "⚠️ MHRA failed"
  npx tsx scripts/import-healthcanada-notices.ts || echo "⚠️ Health Canada failed"
  npx tsx scripts/import-tga-updates.ts || echo "⚠️ TGA failed"
  npx tsx scripts/import-pmda-announcements.ts || echo "⚠️ PMDA failed"

else
  echo "❌ No import scripts found!"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ IMPORT CYCLE COMPLETE"
echo "═══════════════════════════════════════════════"
echo ""
echo "Checking counts..."

# Quick count
REST="${DATABASE_URL#postgresql://}"
USERPASS="${REST%%@*}"
USER="${USERPASS%%:*}"
PASS="${USERPASS#*:}"
HOSTPATH="${REST#*@}"
HOSTPORT="${HOSTPATH%%/*}"
HOST="${HOSTPORT%%:*}"
PORT="${HOSTPORT#*:}"
[ "$PORT" = "$HOST" ] && PORT=5432
DBNAME="${HOSTPATH#*/}"
DBNAME="${DBNAME%%\?*}"

PGPASSWORD="$PASS" psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DBNAME" -c "SELECT COUNT(*) FROM regulatory_updates;"
