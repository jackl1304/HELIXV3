#!/bin/bash
# Helix V3 Server Deployment - Einzeiler für Copy-Paste
# Verbinde zuerst per SSH: ssh root@152.53.191.99 (Passwort: KkZrHw5wrJJnn6TH)

# Dann kopiere diese Zeilen komplett und paste sie ins SSH-Terminal:

npm install -g pm2 && \
mkdir -p /opt/helix && \
cd /opt/helix && \
cat > .env << 'EOFENV'
DATABASE_URL=postgresql://neondb_owner:npg_DnKbP4Wh5zLc@ep-delicate-butterfly-aghj0opi-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
PORT=5000
NODE_ENV=production
EOFENV
echo "✅ .env erstellt" && \
pm2 stop helix 2>/dev/null || echo "Keine laufende Instanz" && \
rm -rf dist node_modules package*.json 2>/dev/null && \
echo "Paste jetzt den BASE64-ENCODED BUILD (kommt als nächstes):"
