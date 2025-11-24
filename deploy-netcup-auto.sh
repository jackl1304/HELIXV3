#!/bin/bash
# Automatisches Deployment nach Netcup mit Backup und Rollback-Sicherheit

set -e
SERVER="root@152.53.191.99"
REMOTE_DIR="/opt/helix"
ARCHIVE_NAME="helix-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"

echo "🚀 Starte Deployment nach Netcup..."
echo "📦 Archive: $ARCHIVE_NAME"

# 1. Prüfe ob SSH erreichbar
echo "🔍 Prüfe SSH-Verbindung..."
if ! ssh -o ConnectTimeout=5 $SERVER "echo 'SSH OK'" 2>/dev/null; then
    echo "❌ SSH-Verbindung fehlgeschlagen. Bitte Firewall/Netzwerk prüfen."
    exit 1
fi

# 2. Upload Archiv
echo "📤 Uploade Build-Archiv..."
scp "$ARCHIVE_NAME" "$SERVER:/tmp/"

# 3. Backup erstellen und entpacken
echo "💾 Erstelle Backup und deploye neuen Build..."
ssh $SERVER << 'ENDSSH'
set -e
cd /opt/helix

# Backup der aktuellen Installation
if [ -d "dist" ]; then
    echo "📦 Sichere aktuelle Installation..."
    tar -czf "backup-$(date +%Y%m%d-%H%M%S).tar.gz" dist/ .env 2>/dev/null || true
    # Behalte nur letzte 3 Backups
    ls -t backup-*.tar.gz | tail -n +4 | xargs rm -f 2>/dev/null || true
fi

# Entpacke neuen Build
echo "📂 Entpacke neuen Build..."
tar -xzf /tmp/helix-deploy-*.tar.gz -C /opt/helix/
rm /tmp/helix-deploy-*.tar.gz

# Installiere fehlende Dependencies falls nötig
if [ -f "dist/package.json" ]; then
    echo "📦 Installiere Production Dependencies..."
    cd dist && npm ci --production --no-audit 2>&1 | grep -v "npm warn" || true
    cd ..
fi

# PM2 Neustart
echo "🔄 Starte PM2 neu..."
pm2 restart helix || pm2 start dist/index.js --name helix --node-args="--max-old-space-size=2048"
pm2 save

echo "✅ Deployment abgeschlossen!"
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment erfolgreich!"
echo "🌐 Server: http://152.53.191.99:5000"
echo "📊 Health: http://152.53.191.99:5000/health"
echo ""
echo "Nächste Schritte:"
echo "1. Logs prüfen: ssh $SERVER 'pm2 logs helix --lines 50'"
echo "2. Import triggern: curl -X POST http://152.53.191.99:5000/api/source-import/trigger"
echo "3. Status prüfen: curl http://152.53.191.99:5000/api/source-import/status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
