# HELIX Netcup Deployment - Alternative Methoden (SSH blockiert)

## Problem: SSH-Verbindung schlägt fehl

SSH-Timeout deutet darauf hin, dass Netcup-Firewall deine aktuelle IP blockiert oder SSH-Port nicht erreichbar ist.

## ✅ Empfohlene Lösung: Netcup VNC Console

### 1. VNC Console öffnen
```
1. Login auf https://www.servercontrolpanel.de/
2. Server auswählen
3. "VNC Console" Button klicken
4. Terminal öffnet sich im Browser
```

### 2. Im VNC Terminal ausführen
```bash
# Wechsel ins Helix-Verzeichnis
cd /opt/helix

# Backup erstellen
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz dist/ .env 2>/dev/null || true

# Build hochladen (Methode A: Lokaler HTTP-Server)
# Auf deinem Windows-PC im HELIXV3-Ordner:
# python -m http.server 8000
# oder: npx http-server -p 8000

# Dann im VNC:
curl -O http://DEINE_WINDOWS_IP:8000/helix-deploy-20251124-065453.tar.gz

# Entpacken
tar -xzf helix-deploy-20251124-065453.tar.gz

# Dependencies installieren
cd dist && npm ci --production --no-audit 2>&1 | grep -v "npm warn"
cd ..

# PM2 neustarten
pm2 restart helix || pm2 start dist/index.js --name helix --node-args="--max-old-space-size=2048"
pm2 save

# Logs prüfen
pm2 logs helix --lines 50
```

### 3. Migrationen ausführen
```bash
cd /opt/helix

# PostgreSQL Verbindung prüfen
psql $DATABASE_URL -c "SELECT COUNT(*) FROM regulatory_updates;"

# Falls Tabelle nicht existiert:
npm run db:push

# Import-Skripte triggern
curl -X POST http://localhost:5000/api/source-import/trigger

# Status überwachen
watch -n 2 "curl -s http://localhost:5000/api/source-import/status | jq"

# Dashboard-Stats prüfen
curl http://localhost:5000/api/dashboard/stats | jq
```

## Alternative: Netcup FTP/SFTP

Falls VNC auch nicht funktioniert:

```bash
# FileZilla oder WinSCP nutzen:
Host: 152.53.191.99
Port: 22 (SFTP) oder 21 (FTP)
User: root
Pass: [dein Server-Passwort]

# Upload nach: /opt/helix/
# Dann per VNC oder SSH (falls später verfügbar) entpacken
```

## Firewall-Check

Falls SSH generell nicht geht:

```bash
# Im Netcup Kontrollpanel:
1. Server-Details öffnen
2. Firewall-Regeln prüfen
3. Port 22 (SSH) für deine IP freigeben
4. Regel speichern & 5 Minuten warten

# Dann erneut testen:
ssh -v root@152.53.191.99
```

## Nach erfolgreichem Deployment

```bash
# 1. Gesundheitscheck
curl http://152.53.191.99:5000/health

# 2. Import starten
curl -X POST http://152.53.191.99:5000/api/source-import/trigger

# 3. Warten und Status prüfen
curl http://152.53.191.99:5000/api/source-import/status

# 4. Dashboard aufrufen
# Browser: http://152.53.191.99:5000/

# 5. Prüfe ob mehr als 3 Updates angezeigt werden
curl http://152.53.191.99:5000/api/regulatory-updates | jq 'length'
```

## Troubleshooting Logs

```bash
# PM2 Logs live verfolgen
pm2 logs helix --lines 100

# Nach DB-Fehlern suchen
pm2 logs helix | grep -i "error\|fail\|database"

# Letzte 50 Zeilen
pm2 logs helix --lines 50 --nostream
```

## DATABASE_URL prüfen

```bash
# Aktuelle Umgebungsvariable anzeigen
pm2 env 0 | grep DATABASE_URL

# Falls falsch, korrigieren:
pm2 stop helix
pm2 delete helix
export DATABASE_URL="postgresql://helix:PASSWORT@localhost:5432/helix"
cd /opt/helix/dist
pm2 start index.js --name helix --node-args="--max-old-space-size=2048"
pm2 save
```

## Build lokal testen (vor Deployment)

```bash
cd L:/HELIXV3/HELIXV3

# Build erstellen
npm run build

# Lokal testen
cd dist
npm ci --production
DATABASE_URL="postgresql://..." node index.js

# Im Browser testen:
http://localhost:5000/api/regulatory-updates
# Sollte NICHT nur 3 Items zeigen
```
