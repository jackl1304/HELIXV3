# HELIX V3 – Production Deployment Guide

**Server:** `152.53.191.99`
**User:** `root` (temporär; empfohlen: dedizierter Deploy-User)
**Webroot:** `/var/www/html`

---

## 🔐 1. SSH-Key Setup (Sicherheit)

### Lokale Key-Generierung
```bash
# Ed25519-Key erstellen (modern, sicher, kompakt)
ssh-keygen -t ed25519 -C "helix-deploy@152.53.191.99" -f ~/.ssh/id_ed25519

# Optional: Passphrase setzen für zusätzliche Sicherheit
# Passphrase dann als Umgebungsvariable hinterlegen:
export SSH_KEY_PASSPHRASE='deine-passphrase'
```

### Public Key auf Server deployen
```bash
# Automatisch (empfohlen)
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@152.53.191.99

# Manuell (falls ssh-copy-id fehlt)
cat ~/.ssh/id_ed25519.pub | ssh root@152.53.191.99 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"
```

### Passwort-Login deaktivieren (härtet Server)
```bash
ssh root@152.53.191.99

# Root-Passwort ändern
passwd

# SSH-Config anpassen
nano /etc/ssh/sshd_config
# Setze: PasswordAuthentication no
# Optional: PermitRootLogin prohibit-password

# SSH neu starten
systemctl restart sshd
```

---

## 📦 2. Frontend-Deployment (Statisch)

### Build & Deploy
```bash
# Lokal: Build erstellen
npm run build

# Upload via SFTP (nutzt .vscode/sftp.json)
npm run deploy:sftp

# Oder kombiniert
npm run deploy
```

**Ergebnis:** Frontend liegt unter `http://152.53.191.99/` (bzw. deine Domain).

---

## 🚀 3. Backend-Deployment (Node.js API)

Das Backend (Express auf Port 5000) muss separat deployt und als Service betrieben werden.

### Server-Vorbereitung
```bash
ssh root@152.53.191.99

# Node.js installieren (falls nicht vorhanden)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# PM2 (Process Manager)
npm install -g pm2

# Zielverzeichnis erstellen
mkdir -p /opt/helix
chown root:root /opt/helix
```

### Backend hochladen
Erweitere `.vscode/sftp.json` um separaten Backend-Upload:
```json
{
  "name": "Backend",
  "host": "152.53.191.99",
  "username": "root",
  "protocol": "sftp",
  "port": 22,
  "remotePath": "/opt/helix",
  "uploadOnSave": false,
  "privateKeyPath": "~/.ssh/id_ed25519",
  "ignore": ["node_modules", "client", ".git", ".vscode"]
}
```

Oder manuell via rsync:
```bash
rsync -avz --exclude 'node_modules' --exclude 'client' --exclude '.git' \
  ./ root@152.53.191.99:/opt/helix/
```

### Auf dem Server: Dependencies & Start
```bash
ssh root@152.53.191.99

cd /opt/helix

# .env anlegen (aus lokalem .env kopieren oder neu erstellen)
nano .env
# Wichtig: DATABASE_URL, OPENROUTER_API_KEY, etc.

# Dependencies installieren (production)
npm ci --production

# Mit PM2 starten
pm2 start dist/index.js --name helix-api --node-args="--max-old-space-size=1024"
pm2 save
pm2 startup systemd

# Logs prüfen
pm2 logs helix-api
```

---

## 🌐 4. Nginx Reverse Proxy (API + Frontend)

Damit Frontend unter `/` läuft und API-Calls automatisch zu Node weitergeleitet werden.

### Nginx-Config
```bash
ssh root@152.53.191.99
apt-get install -y nginx

nano /etc/nginx/sites-available/helix
```

**Inhalt:**
```nginx
server {
    listen 80;
    server_name 152.53.191.99;  # Oder deine Domain

    # Frontend (statische Dateien)
    root /var/www/html;
    index index.html;

    # API-Requests an Node weiterleiten
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health Endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
    }

    # SPA Fallback (für Wouter Routing)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Aktivieren:**
```bash
ln -s /etc/nginx/sites-available/helix /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🔒 5. SSL/HTTPS (Let's Encrypt)

```bash
apt-get install -y certbot python3-certbot-nginx

# SSL-Zertifikat holen (ersetze Domain)
certbot --nginx -d deine-domain.de

# Auto-Renewal prüfen
certbot renew --dry-run
```

---

## 🔄 6. Deployment-Workflow

### Frontend-Update
```bash
npm run deploy
```

### Backend-Update
```bash
# Lokal: Build
npm run build

# Upload
rsync -avz --exclude 'node_modules' dist/ root@152.53.191.99:/opt/helix/dist/

# Server: Restart
ssh root@152.53.191.99 "cd /opt/helix && pm2 restart helix-api"
```

### Automatisiertes Skript (optional)
Erstelle `scripts/deploy-full.sh`:
```bash
#!/bin/bash
set -e

echo "🔨 Building..."
npm run build

echo "📤 Uploading frontend..."
npm run deploy:sftp

echo "📤 Uploading backend..."
rsync -avz --exclude 'node_modules' dist/ root@152.53.191.99:/opt/helix/dist/

echo "🔄 Restarting backend..."
ssh root@152.53.191.99 "cd /opt/helix && pm2 restart helix-api"

echo "✅ Deployment complete!"
```

Ausführbar machen:
```bash
chmod +x scripts/deploy-full.sh
./scripts/deploy-full.sh
```

---

## 🛡️ 7. Sicherheits-Checkliste

- [x] Passwort aus `.vscode/sftp.json` entfernt
- [ ] SSH-Key erstellt und deployt
- [ ] Server-Passwort geändert (aktuell: `7724@Serpha` → neu setzen!)
- [ ] Passwort-Login in SSH deaktiviert
- [ ] Firewall konfiguriert (ufw: Port 22, 80, 443 erlauben)
- [ ] Dedizierter Deploy-User statt root (optional, empfohlen)
- [ ] SSL-Zertifikat eingerichtet (Let's Encrypt)
- [ ] Environment-Secrets in `.env` (nicht in Git!)
- [ ] Regelmäßige Updates: `apt update && apt upgrade`

---

## 📊 8. Monitoring & Logs

### PM2-Befehle
```bash
pm2 status          # Prozess-Status
pm2 logs helix-api  # Live-Logs
pm2 monit           # Ressourcen-Monitor
pm2 restart all     # Alle Services neustarten
```

### Nginx-Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Systemd Journal
```bash
journalctl -u nginx -f
journalctl -u pm2-root -f
```

---

## 🆘 Troubleshooting

### Frontend lädt nicht
- Nginx-Config prüfen: `nginx -t`
- Dateiberechtigungen: `chown -R www-data:www-data /var/www/html`

### API nicht erreichbar
- Backend läuft: `pm2 status`
- Port gebunden: `netstat -tlnp | grep 5000`
- Logs prüfen: `pm2 logs helix-api --lines 50`

### SFTP schlägt fehl
- Key-Permissions: `chmod 600 ~/.ssh/id_ed25519`
- Server erreichbar: `ssh -v root@152.53.191.99`

---

**🎉 Setup vollständig!**
Frontend: `http://152.53.191.99/`
API Health: `http://152.53.191.99/health`
