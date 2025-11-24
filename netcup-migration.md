
# 🚀 HELIX DELTAWAYS - Netcup Migration Guide

## KOMPLETTE MIGRATION VON EXTERNER PLATTFORM ZU NETCUP

### 1. VORBEREITUNG

```bash
# 1. Repository klonen (falls noch nicht vorhanden)
git clone <your-repo-url>
cd helix-deltaways

# 2. Dependencies installieren
npm install --legacy-peer-deps

# 3. Environment Setup
cp .env.example .env
# Alle plattformspezifischen Variablen entfernen und Netcup-URLs setzen
```

### 2. PLATTFORMSPEZIFISCHE ABHÄNGIGKEITEN ENTFERNT ✅

- ❌ Plattform-spezifische Storage APIs
- ❌ Plattform-spezifische Database Bindings
- ❌ Plattform-spezifische Environment Variables
- ✅ Standard Node.js Storage Implementation
- ✅ PostgreSQL/MySQL kompatible DB-Layer
- ✅ Standard Express.js Server
- ✅ Docker-Ready Configuration

### 3. NETCUP DEPLOYMENT

```dockerfile
# Dockerfile bereits optimiert für Netcup
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

### 4. DATENBANK MIGRATION

```sql
-- Vollständige Schema-Erstellung
-- Siehe: database/helix-schema.sql
-- Alle Tabellen für Netcup-PostgreSQL optimiert
```

### 5. UMGEBUNGSVARIABLEN FÜR NETCUP

```env
# Netcup Production Settings
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database (Netcup PostgreSQL)
DATABASE_URL=postgresql://user:password@netcup-db:5432/helix
DB_HOST=your-netcup-db-host
DB_PORT=5432
DB_NAME=helix_deltaways
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# API Keys (über Netcup Secrets verwalten)
OPENAI_API_KEY=your-openai-key
FDA_API_KEY=your-fda-key

# Security
JWT_SECRET=your-jwt-secret-for-netcup
CORS_ORIGIN=https://your-netcup-domain.com
```

### 6. NETCUP NGINX KONFIGURATION

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

### 7. DEPLOYMENT SCRIPTS

```bash
#!/bin/bash
# deploy-netcup.sh

echo "🚀 HELIX DELTAWAYS - Netcup Deployment"

# Build optimieren
npm run build

# PM2 für Production
pm2 stop helix-deltaways || true
pm2 start npm --name "helix-deltaways" -- start
pm2 save

echo "✅ Deployment erfolgreich!"
```

### 8. MONITORING & LOGGING

```javascript
// Netcup-optimierte Logging-Konfiguration
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'helix-deltaways' },
  transports: [
    new winston.transports.File({ filename: '/var/log/helix/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/var/log/helix/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### 9. AUTOMATISIERTER UMZUG

```bash
# Vollautomatisches Migration-Script
./scripts/migrate-to-netcup.sh

# 1. Backup aller Daten
# 2. Export der Datenbank
# 3. Build für Production
# 4. Upload zu Netcup
# 5. Database Import
# 6. Service Start
# 7. Health Check
```

### 10. PERFORMANCE OPTIMIERUNGEN FÜR NETCUP

- ✅ Redis Caching implementiert
- ✅ Database Connection Pooling
- ✅ Gzip Compression aktiviert
- ✅ Static File Optimization
- ✅ CDN-Ready Asset Pipeline
- ✅ Monitoring & Alerting

**🎯 ERGEBNIS: VOLLSTÄNDIG NETCUP-READY!**
