#!/bin/bash
# Server-seitige Prüf- und Import-Befehle
# Direkt auf Netcup Server ausführen

echo "═══════════════════════════════════════════════"
echo "📊 HELIX STATUS CHECK"
echo "═══════════════════════════════════════════════"
echo ""

# 1. Environment aus PM2 auslesen
echo "1️⃣ PM2 Environment Variables:"
pm2 env helix-api | grep DATABASE_URL
echo ""

# 2. Extrahiere DB Connection Details
echo "2️⃣ Parsing DATABASE_URL..."
export $(pm2 env helix-api | grep DATABASE_URL | xargs)
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL nicht gefunden in PM2"
  echo "Versuche aus .env..."
  cd /opt/helix
  if [ -f .env ]; then
    export $(cat .env | grep DATABASE_URL | xargs)
  fi
fi

echo "DATABASE_URL: $DATABASE_URL"
echo ""

# 3. Parse Connection String
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

echo "Host: $HOST"
echo "Port: $PORT"
echo "User: $USER"
echo "DB: $DBNAME"
echo ""

# 4. Row Counts
echo "3️⃣ Database Row Counts:"
PGPASSWORD="$PASS" psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DBNAME" -t -c "
SELECT
  'regulatory_updates: ' || COUNT(*) FROM regulatory_updates
UNION ALL
SELECT
  'data_sources: ' || COUNT(*) FROM data_sources
UNION ALL
SELECT
  'legal_cases: ' || COUNT(*) FROM legal_cases;
"
echo ""

# 5. Scheduler Status
echo "4️⃣ Scheduler Status:"
curl -s http://localhost:5000/api/source-import/status | head -20
echo ""

# 6. PM2 Logs (letzte Scheduler-Meldungen)
echo "5️⃣ Recent Scheduler Logs:"
pm2 logs helix-api --nostream --lines 50 | grep -E '\[SCHED\]|\[DB\]' | tail -20
echo ""

# 7. Import-Scripts verfügbar?
echo "6️⃣ Import Scripts Check:"
if [ -d "/opt/helix/dist/import-scripts" ]; then
  echo "✅ dist/import-scripts existiert"
  ls -lh /opt/helix/dist/import-scripts/*.js 2>/dev/null || echo "⚠️ Keine JS Dateien"
else
  echo "❌ dist/import-scripts fehlt"
fi
echo ""

echo "═══════════════════════════════════════════════"
echo "✅ CHECK COMPLETE"
echo "═══════════════════════════════════════════════"
