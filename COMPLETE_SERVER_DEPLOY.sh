#!/bin/bash
# Helix V3 Complete Server Deployment
#
# ANLEITUNG:
# 1. Verbinde per SSH: ssh root@152.53.191.99
#    Passwort: KkZrHw5wrJJnn6TH
#
# 2. Kopiere ALLES zwischen den === Markierungen und paste es ins SSH-Terminal
#
# ============================================================================

# Installation und Setup
npm install -g pm2 && \
sudo mkdir -p /opt/helix && \
cd /opt/helix && \

# .env Datei erstellen
cat > .env << 'EOFENV'
DATABASE_URL=postgresql://neondb_owner:npg_DnKbP4Wh5zLc@ep-delicate-butterfly-aghj0opi-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
PORT=5000
NODE_ENV=production
EOFENV

echo "✅ .env erstellt" && \

# Alte Version stoppen und aufräumen
pm2 stop helix 2>/dev/null || echo "Keine laufende Instanz" && \
rm -rf dist node_modules package*.json helix-deploy*.tar.gz 2>/dev/null && \

# Build herunterladen (vom lokalen PC)
# WICHTIG: Ersetze die IP wenn dein PC eine andere hat!
curl -f -o helix-deploy.tar.gz http://192.168.178.85:8000/helix-deploy-20251124-065422.tar.gz && \
echo "✅ Download erfolgreich" && \

# Entpacken
tar -xzf helix-deploy.tar.gz && \
echo "✅ Entpackt" && \

# Dependencies installieren
npm install --omit=dev && \
echo "✅ Dependencies installiert" && \

# PM2 starten
pm2 start dist/index.js --name helix --env production && \
echo "✅ PM2 gestartet" && \

# PM2 Auto-Start einrichten
pm2 save && \
echo "✅ PM2 gespeichert" && \

# Status prüfen
pm2 status && \
pm2 logs helix --lines 10 && \

# Import triggern
sleep 3 && \
curl -X POST http://localhost:5000/api/source-import/trigger && \
echo "" && \
echo "✅ Deployment abgeschlossen!" && \
echo "Dashboard: http://152.53.191.99:5000/"

# ============================================================================
#
# FALLS DER DOWNLOAD NICHT FUNKTIONIERT (curl gibt 404 oder connection refused):
#
# Alternative: Upload via SCP in einem ZWEITEN lokalen Terminal:
# scp helix-deploy-20251124-065422.tar.gz root@152.53.191.99:/opt/helix/helix-deploy.tar.gz
# (Passwort: KkZrHw5wrJJnn6TH)
#
# Dann im SSH-Terminal ab "# Entpacken" weitermachen
#
