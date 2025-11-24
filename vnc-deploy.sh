#!/bin/bash
# Schnell-Deployment via VNC Console
# Einfach kopieren und im VNC Terminal einfügen!

cd /opt/helix

# Backup
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz dist/ .env 2>/dev/null || true

# Download (ersetze IP mit deiner Windows-IP falls HTTP-Server läuft)
curl -O http://192.168.178.85:8000/helix-deploy-20251124-065453.tar.gz

# Entpacken
tar -xzf helix-deploy-*.tar.gz && rm helix-deploy-*.tar.gz

# Dependencies
cd dist && npm ci --production --no-audit 2>&1 | grep -v warn && cd ..

# PM2 restart
pm2 restart helix || pm2 start dist/index.js --name helix --node-args="--max-old-space-size=2048"
pm2 save

# Health Check
sleep 2 && curl http://localhost:5000/health | jq

echo ""
echo "✅ Deployment fertig!"
echo ""
echo "Nächste Schritte:"
echo "1. Import starten: curl -X POST http://localhost:5000/api/source-import/trigger"
echo "2. Status prüfen: curl http://localhost:5000/api/source-import/status | jq"
echo "3. Dashboard: http://152.53.191.99:5000/"
