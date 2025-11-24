# VNC Console Deployment - Netcup Server

## Problem
SSH ist nicht zuverlässig erreichbar (Connection Timeout).
Die einzige Lösung ist die **VNC Console** über das Servercontrolpanel.

## Schritt-für-Schritt Anleitung

### 1. VNC Console öffnen
1. Gehe zu: https://www.servercontrolpanel.de/
2. Login mit deinen Netcup Zugangsdaten
3. Wähle deinen Server (152.53.191.99)
4. Klicke auf **"VNC Console"** oder **"noVNC"**
5. Ein Browser-Terminal öffnet sich

### 2. Im VNC Terminal anmelden
- Username: `root`
- Password: `7724@Serpha`

### 3. Build-Datei hochladen

**Option A: Über Servercontrolpanel File Upload**
1. Im SCP gehe zu "Dateien" oder "File Manager"
2. Navigiere zu `/tmp/`
3. Upload `helix-deploy-20251124-065422.tar.gz` (7 MB)

**Option B: Über wget im VNC Terminal** (wenn dein PC vom Server erreichbar ist)
```bash
cd /tmp
wget http://192.168.178.85:8000/helix-deploy-20251124-065422.tar.gz
```

**Option C: Via curl**
```bash
cd /tmp
curl -O http://192.168.178.85:8000/helix-deploy-20251124-065422.tar.gz
```

### 4. Deployment ausführen

Kopiere diese Kommandos komplett und paste sie ins VNC Terminal:

```bash
# PM2 installieren
npm install -g pm2

# Verzeichnis erstellen
mkdir -p /opt/helix
cd /opt/helix

# .env Datei erstellen
cat > .env << 'EOFENV'
DATABASE_URL=postgresql://neondb_owner:npg_DnKbP4Wh5zLc@ep-delicate-butterfly-aghj0opi-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
PORT=5000
NODE_ENV=production
EOFENV

# Alte Instanz stoppen
pm2 stop helix 2>/dev/null || echo "Keine alte Instanz"

# Aufräumen
rm -rf dist node_modules package*.json helix-deploy*.tar.gz

# Build entpacken (aus /tmp)
cp /tmp/helix-deploy-20251124-065422.tar.gz .
tar -xzf helix-deploy-20251124-065422.tar.gz

# Dependencies installieren
npm install --omit=dev

# PM2 starten
pm2 start dist/index.js --name helix --env production

# PM2 beim Boot auto-starten
pm2 startup
# (Kopiere den ausgegebenen Befehl und führe ihn aus)
pm2 save

# Status prüfen
pm2 status
pm2 logs helix --lines 20

# Health Check
curl http://localhost:5000/health

# Import triggern
curl -X POST http://localhost:5000/api/source-import/trigger

# Dashboard Stats
curl http://localhost:5000/api/dashboard/stats
```

### 5. Verify Deployment

**Im Browser:**
- http://152.53.191.99:5000/ - Dashboard sollte laden
- http://152.53.191.99:5000/health - Sollte `{"status":"ok"}` zeigen

**Im VNC Terminal:**
```bash
# Logs live verfolgen
pm2 logs helix

# Status prüfen
pm2 status

# Neustart falls nötig
pm2 restart helix
```

### 6. Nginx Setup (Optional, falls Port 5000 nicht von außen erreichbar)

Falls du Nginx als Reverse Proxy brauchst:

```bash
# Nginx installieren
apt update
apt install -y nginx

# Nginx Config
cat > /etc/nginx/sites-available/helix << 'NGINXEOF'
server {
    listen 80;
    server_name 152.53.191.99;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Aktivieren
ln -sf /etc/nginx/sites-available/helix /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

Dann ist die App unter http://152.53.191.99/ (Port 80) erreichbar.

---

## Troubleshooting

### PM2 läuft nicht
```bash
pm2 list
pm2 logs helix --lines 50
```

### Port 5000 nicht erreichbar
```bash
# Prüfe ob der Port offen ist
netstat -tulpn | grep 5000

# Firewall prüfen
ufw status

# Firewall Port öffnen falls nötig
ufw allow 5000/tcp
```

### Import läuft nicht
```bash
# Status prüfen
curl http://localhost:5000/api/source-import/status

# Manuell triggern
curl -X POST http://localhost:5000/api/source-import/trigger

# Logs checken
pm2 logs helix | grep import
```

### Datenbank Verbindung fehlschlägt
```bash
# .env prüfen
cat /opt/helix/.env

# Test-Query
cd /opt/helix
node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT 1+1 as result\`.then(r => console.log('DB OK:', r)).catch(e => console.error('DB Error:', e));
"
```

---

## Nächste Schritte nach erfolgreichem Deployment

1. ✅ Dashboard öffnen: http://152.53.191.99:5000/
2. ✅ Warte 2-3 Minuten auf ersten Import
3. ✅ Prüfe Metriken: Sollten > 3 Updates zeigen
4. ✅ Scheduler läuft automatisch alle 30 Minuten
5. ✅ PM2 startet die App automatisch nach Server-Reboot

**Fertig!** 🎉
