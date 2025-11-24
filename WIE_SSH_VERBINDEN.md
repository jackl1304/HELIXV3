# ⚠️ WICHTIG: SSH-VERBINDUNG ZUM SERVER ÖFFNEN!

## DU BIST GERADE AUF DEINEM LOKALEN PC!

Die Kommandos müssen auf dem SERVER ausgeführt werden, nicht lokal!

## SO ÖFFNEST DU EINE SSH-VERBINDUNG:

### Option 1: PowerShell (EMPFOHLEN)
1. Öffne ein **NEUES PowerShell Fenster** (nicht Git Bash!)
2. Tippe:
   ```powershell
   ssh root@152.53.191.99
   ```
3. Passwort eingeben: `KkZrHw5wrJJnn6TH`
4. Warte bis der Prompt sich ändert zu: `root@vXXXXXX:~#`
5. JETZT erst die Deployment-Kommandos ausführen!

### Option 2: PuTTY
1. Download: https://www.putty.org/
2. Host Name: `152.53.191.99`
3. Port: `22`
4. Click "Open"
5. Username: `root`
6. Password: `KkZrHw5wrJJnn6TH`

## ERKENNUNGSMERKMALE:

❌ **Du bist LOKAL** wenn der Prompt zeigt:
```
Marco@DESKTOP-F0UCMSI MINGW64 /l/HELIXV3/HELIXV3 (main)
$
```

✅ **Du bist auf dem SERVER** wenn der Prompt zeigt:
```
root@vXXXXXX:~#
```
oder
```
root@v12345:~#
```

## NACHDEM DU AUF DEM SERVER BIST:

Kopiere und paste diese Kommandos:

```bash
npm install -g pm2
mkdir -p /opt/helix
cd /opt/helix

cat > .env << 'EOFENV'
DATABASE_URL=postgresql://neondb_owner:npg_DnKbP4Wh5zLc@ep-delicate-butterfly-aghj0opi-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
PORT=5000
NODE_ENV=production
EOFENV

pm2 stop helix 2>/dev/null || true
rm -rf dist node_modules package*.json helix-deploy*.tar.gz

# Download von deinem PC (HTTP Server läuft auf Port 8000)
curl -O http://192.168.178.85:8000/helix-deploy-20251124-065422.tar.gz

# ODER falls curl nicht funktioniert, nutze wget:
# wget http://192.168.178.85:8000/helix-deploy-20251124-065422.tar.gz

# Entpacken (Datei sollte jetzt im aktuellen Verzeichnis sein)
tar -xzf helix-deploy-20251124-065422.tar.gz

npm install --omit=dev
pm2 start dist/index.js --name helix --env production
pm2 save
pm2 status
pm2 logs helix --lines 20
```

## WICHTIG:
1. Du MUSST die SSH-Verbindung öffnen BEVOR du die Kommandos ausführst!
2. Git Bash funktioniert NICHT zuverlässig für SSH - nutze PowerShell!
3. Der Prompt muss `root@v...` zeigen, nicht `Marco@DESKTOP`!
