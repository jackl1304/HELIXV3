# 🚀 HELIX REGULATORY INTELLIGENCE
## Netcup Deployment Guide

### Voraussetzungen

- Netcup vServer (VPS 2000 oder höher empfohlen)
- Ubuntu 22.04 LTS oder Debian 12
- Docker & Docker Compose installiert
- Minimum 4GB RAM, 20GB SSD
- PostgreSQL-Datenbank (Neon, Supabase, oder lokal)

---

## 🔧 Ersteinrichtung auf Netcup Server

### 1. Server vorbereiten

```bash
# SSH-Verbindung zum Server
ssh root@<ihre-server-ip>

# System aktualisieren
apt update && apt upgrade -y

# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
apt install docker-compose -y

# Git installieren
apt install git -y
```

### 2. Repository klonen

```bash
# Arbeitsverzeichnis erstellen
mkdir -p /opt/helix
cd /opt/helix

# Repository klonen
git clone <your-repository-url> .

# Oder per ZIP Upload und entpacken:
# unzip helix-regulatory.zip -d /opt/helix
```

### 3. Environment konfigurieren

```bash
# .env Datei erstellen
cp .env.example .env
nano .env
```

**Wichtige Environment-Variablen für Netcup:**

```env
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database (Neon Cloud oder lokales PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/helix_regulatory?sslmode=require"

# API Keys
ANTHROPIC_API_KEY=sk-ant-...
FDA_API_KEY=your-fda-key
OPENAI_API_KEY=sk-...

# Optional: Data Collection Control
REG_AUTO_ENABLED=true

# Security
SESSION_SECRET=$(openssl rand -hex 32)
```

### 4. Deployment ausführen

```bash
# Deployment-Skript ausführbar machen
chmod +x scripts/netcup-deploy.sh

# Deployment starten
./scripts/netcup-deploy.sh latest production
```

Das Skript führt automatisch aus:
- ✅ Pre-Deployment Checks
- ✅ Docker Image Build
- ✅ Datenbank-Migrationen
- ✅ Service-Start mit Health Checks
- ✅ Cleanup alter Images

---

## 🌐 Nginx Reverse Proxy (Optional, für HTTPS)

### 1. Nginx installieren

```bash
apt install nginx certbot python3-certbot-nginx -y
```

### 2. Nginx konfigurieren

```bash
nano /etc/nginx/sites-available/helix
```

**Nginx-Konfiguration:**

```nginx
server {
    listen 80;
    server_name helix.ihre-domain.de;

    # Reverse Proxy zu HELIX
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts für lange API-Calls
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Health Check Endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

### 3. Nginx aktivieren und SSL einrichten

```bash
# Site aktivieren
ln -s /etc/nginx/sites-available/helix /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# SSL-Zertifikat mit Let's Encrypt
certbot --nginx -d helix.ihre-domain.de
```

---

## 🔄 Updates & Wartung

### Application Update

```bash
cd /opt/helix

# Code aktualisieren
git pull origin main

# Deployment durchführen
./scripts/netcup-deploy.sh latest production
```

### Logs anzeigen

```bash
# Live-Logs verfolgen
docker-compose logs -f helix-app

# Letzte 100 Zeilen
docker-compose logs --tail=100 helix-app

# Nginx-Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Container neu starten

```bash
docker-compose restart helix-app
```

### Datenbank-Backup

```bash
# Automatisches Backup (läuft täglich im Container)
docker-compose logs backup

# Manuelles Backup
docker exec -t helix-postgres pg_dump -U helix_user helix_regulatory > backup_$(date +%Y%m%d).sql
```

---

## 📊 Monitoring & Health Checks

### System-Ressourcen überwachen

```bash
# Docker Stats
docker stats

# Container Status
docker-compose ps

# Disk Space
df -h
```

### Application Health

```bash
# Health Check
curl http://localhost:5000/health

# API Test
curl http://localhost:5000/api/health
```

### Automatisches Monitoring (Optional)

```bash
# Prometheus & Grafana starten (bereits in docker-compose.yml konfiguriert)
docker-compose up -d prometheus grafana

# Grafana UI: http://ihre-domain.de:3001
# Standard Login: admin / admin (aus .env)
```

---

## 🔒 Sicherheit

### Firewall konfigurieren

```bash
# UFW Firewall aktivieren
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Fail2Ban installieren (Optional)

```bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

### SSH absichern

```bash
nano /etc/ssh/sshd_config

# Änderungen:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

systemctl restart sshd
```

---

## 🚨 Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker-compose logs helix-app

# Container-Status
docker-compose ps

# Neu bauen ohne Cache
docker-compose build --no-cache
docker-compose up -d
```

### Port 5000 bereits belegt

```bash
# Prozess finden
netstat -tulpn | grep 5000
lsof -i :5000

# Prozess beenden
kill -9 <PID>
```

### Datenbank-Verbindung fehlgeschlagen

```bash
# PostgreSQL erreichbar?
psql $DATABASE_URL

# Neon Connection String Format prüfen:
# postgresql://user:password@host.neon.tech:5432/dbname?sslmode=require
```

### Out of Memory

```bash
# Swap hinzufügen
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 📞 Support & Kontakt

- **Dokumentation:** [API_REFERENCE_HELIX.md](./API_REFERENCE_HELIX.md)
- **Issue Tracker:** GitHub Issues
- **Support Email:** support@deltaways.de

---

## ✅ Deployment-Checkliste

- [ ] Server eingerichtet (Ubuntu/Debian)
- [ ] Docker & Docker Compose installiert
- [ ] Repository geklont
- [ ] .env konfiguriert (DATABASE_URL, API Keys)
- [ ] `netcup-deploy.sh` ausgeführt
- [ ] Health Check erfolgreich (http://localhost:5000/health)
- [ ] Nginx Reverse Proxy konfiguriert (optional)
- [ ] SSL-Zertifikat eingerichtet (optional)
- [ ] Firewall konfiguriert
- [ ] Monitoring aktiviert (optional)
- [ ] Backup-Strategie implementiert

---

**🎉 HELIX ist jetzt produktiv auf Netcup!**
