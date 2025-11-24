# HELIX V3 - Schnell-Deployment Anleitung

## Status Quo
✅ Build fertig (`dist/` vorhanden)
✅ Frontend deployed (http://152.53.191.99/)
⚠️ Backend fehlt noch (PostgreSQL, PM2, Nginx-Proxy)

## Manuelle Backend-Einrichtung (15 Minuten)

Da die automatischen SSH-Skripte Password-Auth-Probleme haben, hier die manuellen Schritte:

### 1. SSH-Verbindung herstellen
```bash
ssh root@152.53.191.99
# Passwort eingeben
```

### 2. System-Dependencies installieren
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# PostgreSQL
apt-get update
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Nginx (bereits installiert)
apt-get install -y nginx

# PM2
npm install -g pm2

# Verifizieren
node --version  # sollte v20.x zeigen
psql --version
pm2 --version
```

### 3. PostgreSQL Datenbank einrichten
```bash
sudo -u postgres psql << 'EOF'
CREATE DATABASE helix;
CREATE USER helix WITH ENCRYPTED PASSWORD 'helix_prod_2025!';
GRANT ALL PRIVILEGES ON DATABASE helix TO helix;
\c helix
GRANT ALL ON SCHEMA public TO helix;
ALTER DATABASE helix OWNER TO helix;
\q
EOF
```

### 4. Backend-Dateien hochladen (von lokalem Terminal)
```bash
# Archiv erstellen
cd /l/HELIXV3/HELIXV3
tar -czf /tmp/helix-backend.tar.gz \
  dist/index.js \
  package.json \
  package-lock.json \
  drizzle.config.ts \
  shared/ \
  server/ \
  migrations/

# Hochladen
scp /tmp/helix-backend.tar.gz root@152.53.191.99:/tmp/

# Auf Server: extrahieren
ssh root@152.53.191.99
mkdir -p /opt/helix
cd /opt/helix
tar -xzf /tmp/helix-backend.tar.gz
rm /tmp/helix-backend.tar.gz
```

### 5. Environment konfigurieren (auf Server)
```bash
cd /opt/helix
cat > .env << 'ENV'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://helix:helix_prod_2025!@localhost:5432/helix

# API Keys - SPÄTER KONFIGURIEREN
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=

# Email (optional)
SENDGRID_API_KEY=

# Session Secret
SESSION_SECRET=$(openssl rand -base64 32)
ENV
```

### 6. Dependencies & Migration
```bash
cd /opt/helix
npm ci --production
npm run db:push
```

### 7. PM2 Service starten
```bash
cd /opt/helix
pm2 start dist/index.js --name helix-api --node-args="--max-old-space-size=2048" --time
pm2 save
pm2 startup systemd -u root --hp /root

# Letzten Befehl aus der Ausgabe kopieren und ausführen, z.B.:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# Status prüfen
pm2 status
pm2 logs helix-api --lines 20
```

### 8. Nginx konfigurieren
```bash
cat > /etc/nginx/sites-available/helix << 'NGINXCONF'
server {
    listen 80;
    server_name 152.53.191.99;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    root /var/www/html;
    index index.html;

    # API proxy
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    access_log /var/log/nginx/helix-access.log;
    error_log /var/log/nginx/helix-error.log;
}
NGINXCONF

# Aktivieren
ln -sf /etc/nginx/sites-available/helix /etc/nginx/sites-enabled/helix
rm -f /etc/nginx/sites-enabled/default

# Testen und neu laden
nginx -t
systemctl reload nginx
```

### 9. Firewall (optional aber empfohlen)
```bash
apt-get install -y ufw
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status
```

### 10. Testen
```bash
# Auf Server
curl http://localhost:5000/health
pm2 status

# Von lokal
curl http://152.53.191.99/health
```

## Erfolgskontrolle
- ✅ Frontend: http://152.53.191.99/
- ✅ Health: http://152.53.191.99/health → {"status":"healthy"}
- ✅ PM2: `pm2 status` zeigt `helix-api` online
- ✅ Nginx: `systemctl status nginx` aktiv

## API-Keys konfigurieren
```bash
ssh root@152.53.191.99
nano /opt/helix/.env

# Füge Keys hinzu:
# OPENROUTER_API_KEY=sk-or-v1-...
# ANTHROPIC_API_KEY=sk-ant-...
# GROQ_API_KEY=gsk_...

# Backend neustarten
pm2 restart helix-api
pm2 logs helix-api
```

## Updates deployen
```bash
# Lokal
npm run build
npm run deploy:sftp  # Frontend

# Backend
cd /l/HELIXV3/HELIXV3
tar -czf /tmp/helix-backend.tar.gz dist/index.js
scp /tmp/helix-backend.tar.gz root@152.53.191.99:/tmp/

# Server
ssh root@152.53.191.99
cd /opt/helix
tar -xzf /tmp/helix-backend.tar.gz
pm2 restart helix-api
```

## SSL einrichten (optional)
```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.de
```

## Troubleshooting
```bash
# Backend-Logs
pm2 logs helix-api --lines 100

# Nginx-Logs
tail -f /var/log/nginx/helix-error.log

# Datenbank-Verbindung testen
psql postgresql://helix:helix_prod_2025!@localhost:5432/helix -c "\dt"

# Port-Bindung prüfen
netstat -tlnp | grep 5000
```
