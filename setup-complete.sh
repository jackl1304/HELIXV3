#!/bin/bash
# HELIX COMPLETE SETUP & DATA IMPORT
# Führt alle nötigen Schritte aus um Daten zu importieren

set -e

echo "════════════════════════════════════════════════════════════"
echo "🚀 HELIX COMPLETE SETUP - DATA IMPORT"
echo "════════════════════════════════════════════════════════════"
echo ""

cd /opt/helix

# 1. Stelle sicher dass alle Dependencies da sind
echo "📦 Step 1: Dependencies..."
npm install --silent
echo "✅ Dependencies OK"
echo ""

# 2. Build Import Scripts falls nicht vorhanden
echo "🔨 Step 2: Building import scripts..."
if [ ! -d "dist/import-scripts" ] || [ ! -f "dist/import-scripts/import-fda-510k.js" ]; then
  echo "Building scripts..."
  npx esbuild \
    scripts/script-db.ts \
    scripts/import-fda-510k.ts \
    scripts/import-ema-news.ts \
    scripts/import-who-guidance.ts \
    scripts/import-mhra-updates.ts \
    scripts/import-healthcanada-notices.ts \
    scripts/import-tga-updates.ts \
    scripts/import-pmda-announcements.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outdir=dist/import-scripts \
    --log-level=error
  echo "✅ Scripts built"
else
  echo "✅ Scripts already exist"
fi
ls -lh dist/import-scripts/*.js | head -5
echo ""

# 3. Environment aus PM2 laden
echo "🔧 Step 3: Loading environment..."
export $(pm2 env helix-api 2>/dev/null | grep DATABASE_URL | xargs) || true
if [ -z "$DATABASE_URL" ]; then
  if [ -f .env ]; then
    export $(cat .env | grep DATABASE_URL | xargs)
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found!"
  echo "Please set it in .env file"
  exit 1
fi

echo "✅ DATABASE_URL loaded (${DATABASE_URL:0:30}...)"
echo ""

# 4. Migration prüfen (pgvector)
echo "🗄️  Step 4: Database migration check..."
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

echo "Checking vector extension..."
PGPASSWORD="$PASS" psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DBNAME" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || echo "Extension already exists or no permission"
echo "✅ Database ready"
echo ""

# 5. Counts VOR Import
echo "📊 Step 5: Row counts BEFORE import..."
PGPASSWORD="$PASS" psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DBNAME" -t -c "
SELECT 'regulatory_updates: ' || COUNT(*) FROM regulatory_updates;
SELECT 'data_sources: ' || COUNT(*) FROM data_sources;
SELECT 'legal_cases: ' || COUNT(*) FROM legal_cases;
" 2>/dev/null || echo "Could not query counts"
echo ""

# 6. IMPORT DURCHFÜHREN
echo "🔄 Step 6: RUNNING IMPORTS..."
echo "════════════════════════════════════════════════════════════"

for script in dist/import-scripts/import-*.js; do
  name=$(basename "$script" .js | sed 's/import-//')
  echo ""
  echo "▶ Running $name..."
  if node "$script" 2>&1 | tail -10; then
    echo "✅ $name completed"
  else
    echo "⚠️  $name had errors (continuing...)"
  fi
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# 7. Counts NACH Import
echo "📊 Step 7: Row counts AFTER import..."
PGPASSWORD="$PASS" psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DBNAME" -t -c "
SELECT 'regulatory_updates: ' || COUNT(*) FROM regulatory_updates;
SELECT 'data_sources: ' || COUNT(*) FROM data_sources;
SELECT 'legal_cases: ' || COUNT(*) FROM legal_cases;
"
echo ""

# 8. Scheduler aktivieren
echo "⏰ Step 8: Activating scheduler..."
export AUTO_SEED=0  # Deaktivieren, da wir manuell importiert haben
export IMPORT_INTERVAL_MINUTES=30
export FORCE_IMPORT=0
pm2 restart helix-api --update-env
sleep 3
echo "✅ Service restarted with scheduler (30min interval)"
echo ""

# 9. Status Check
echo "🔍 Step 9: Final status check..."
curl -s http://localhost:5000/api/source-import/status 2>/dev/null | head -20 || echo "Status endpoint not responding yet"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "✅ SETUP COMPLETE!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Website: http://www.deltaways-helix.de"
echo "📊 Status: http://152.53.191.99:5000/api/source-import/status"
echo ""
echo "📝 Check logs: pm2 logs helix-api"
echo "🔄 Manual import: cd /opt/helix && bash setup-complete.sh"
echo ""
