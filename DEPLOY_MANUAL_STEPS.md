# Manual Deployment Steps für Netcup Server

## Problem
SSH-Verbindung von VS Code/Terminal funktioniert nicht zuverlässig (Connection timeout).
Du musst **manuell** per SSH verbinden.

## Lösung: PuTTY oder Windows SSH Client

### Option 1: Windows PowerShell SSH
```powershell
# Öffne PowerShell (NICHT Git Bash)
ssh root@152.53.191.99
# Passwort: 7724@Serpha
```

### Option 2: PuTTY Download
1. Download: https://www.putty.org/
2. Host: `152.53.191.99`
3. Port: `22`
4. User: `root`
5. Password: `7724@Serpha`

---

## Deployment-Kommandos auf dem Server ausführen

Sobald du **auf dem Server** bist (Prompt zeigt `root@...`), führe aus:

```bash
# 1. PM2 installieren
npm install -g pm2

# 2. Verzeichnis erstellen
sudo mkdir -p /opt/helix
cd /opt/helix

# 3a. Datei per wget holen (wenn lokaler HTTP-Server erreichbar)
wget http://192.168.178.85:8000/helix-deploy-20251124-065422.tar.gz

# ODER 3b. Falls wget nicht funktioniert - Alternative Upload-Methode:
# Öffne ein ZWEITES Terminal lokal und führe aus:
# scp helix-deploy-20251124-065422.tar.gz root@152.53.191.99:/opt/helix/

# 4. Entpacken
tar -xzf helix-deploy-20251124-065422.tar.gz

# 5. Dependencies installieren
npm install --omit=dev

# 6. .env Datei erstellen (WICHTIG!)
cat > .env << 'EOF'
DATABASE_URL=postgresql://neondb_owner:npg_DnKbP4Wh5zLc@ep-delicate-butterfly-aghj0opi-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
PORT=5000
NODE_ENV=production
EOF

# 7. PM2 starten
pm2 start dist/index.js --name helix --env production

# 8. PM2 beim Neustart automatisch starten
pm2 startup
# (Kopiere den ausgegebenen Befehl und führe ihn aus)
pm2 save

# 9. Status prüfen
pm2 status
pm2 logs helix --lines 20

# 10. Import triggern
curl -X POST http://localhost:5000/api/source-import/trigger

# 11. Dashboard testen
curl http://localhost:5000/api/dashboard/stats
```

---

## Wichtig zu beachten

1. **Du musst AUF DEM SERVER sein** - Prompt sollte zeigen: `root@vXXXXXX:~#`
2. **NICHT im lokalen Windows-Terminal** - dort läuft alles lokal, nicht auf dem Server!
3. **Die .env Datei muss auf dem Server existieren** mit der Neon DATABASE_URL

---

## Verification

Nach dem Deployment sollte folgendes funktionieren:

```bash
# Auf dem Server:
curl http://localhost:5000/health
# Sollte zurückgeben: {"status":"ok"}

# Von deinem PC aus:
curl http://152.53.191.99:5000/health
# Sollte auch funktionieren

# Browser:
http://152.53.191.99:5000/
# Dashboard sollte laden
```

---

## Nächste Schritte

1. Verbinde per SSH (PuTTY oder PowerShell)
2. Führe die Kommandos oben aus
3. Prüfe ob PM2 läuft: `pm2 list`
4. Teste Dashboard im Browser
