#!/bin/bash
# HELIX DELTAWAYS - Netcup Deployment Script
# Optimiert für Netcup vServer/Webhosting mit Docker

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 HELIX REGULATORY INTELLIGENCE${NC}"
echo -e "${BLUE}   Netcup Deployment Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Konfiguration
APP_NAME="helix-regulatory"
VERSION=${1:-latest}
DEPLOY_ENV=${2:-production}

echo -e "${YELLOW}📋 Deployment-Konfiguration:${NC}"
echo "   Version: ${VERSION}"
echo "   Environment: ${DEPLOY_ENV}"
echo ""

# Pre-Deployment Checks
echo -e "${YELLOW}🔍 Pre-Deployment Checks...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker nicht installiert!${NC}"
    echo "   Installation: sudo apt-get install docker.io docker-compose"
    exit 1
fi
echo -e "${GREEN}✅ Docker verfügbar${NC}"

# Check .env File
if [[ ! -f ".env" ]]; then
    echo -e "${RED}❌ .env Datei fehlt!${NC}"
    echo "   Bitte .env.example kopieren und anpassen"
    exit 1
fi
echo -e "${GREEN}✅ Environment-Datei gefunden${NC}"

# Check Required Environment Variables
source .env
required_vars=("DATABASE_URL" "PORT")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}❌ Umgebungsvariable fehlt: $var${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ Alle erforderlichen Umgebungsvariablen gesetzt${NC}"

# Stop alte Container
echo ""
echo -e "${YELLOW}🛑 Stoppe alte Container...${NC}"
docker-compose down --remove-orphans || true
echo -e "${GREEN}✅ Container gestoppt${NC}"

# Backup alte Images (optional)
echo ""
echo -e "${YELLOW}💾 Erstelle Image-Backup...${NC}"
BACKUP_TAG="${APP_NAME}:backup-$(date +%Y%m%d-%H%M%S)"
if docker images ${APP_NAME}:latest -q &> /dev/null; then
    docker tag ${APP_NAME}:latest ${BACKUP_TAG} || true
    echo -e "${GREEN}✅ Backup erstellt: ${BACKUP_TAG}${NC}"
else
    echo -e "${BLUE}ℹ️  Kein vorheriges Image zum Backup${NC}"
fi

# Build neue Images
echo ""
echo -e "${YELLOW}🔨 Baue neue Docker Images...${NC}"
docker-compose build --no-cache

if [[ $? -ne 0 ]]; then
    echo -e "${RED}❌ Docker Build fehlgeschlagen!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build erfolgreich${NC}"

# Database Migrations
echo ""
echo -e "${YELLOW}🗄️  Führe Datenbank-Migrationen aus...${NC}"
docker-compose run --rm helix-app npm run db:push || {
    echo -e "${YELLOW}⚠️  Migration fehlgeschlagen - verwende bestehende DB-Schema${NC}"
}

# Starte Services
echo ""
echo -e "${YELLOW}🚀 Starte Services...${NC}"
docker-compose up -d

if [[ $? -ne 0 ]]; then
    echo -e "${RED}❌ Service-Start fehlgeschlagen!${NC}"
    exit 1
fi

# Warte auf Healthcheck
echo ""
echo -e "${YELLOW}⏳ Warte auf Application Start...${NC}"
max_attempts=30
attempt=0
while [[ $attempt -lt $max_attempts ]]; do
    if curl -sf http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application ist bereit!${NC}"
        break
    fi
    ((attempt++))
    echo -n "."
    sleep 2
done

if [[ $attempt -eq $max_attempts ]]; then
    echo -e "${RED}❌ Timeout beim Warten auf Application!${NC}"
    echo "   Prüfe Logs: docker-compose logs -f helix-app"
    exit 1
fi

# Cleanup alte Images
echo ""
echo -e "${YELLOW}🧹 Cleanup alte Docker Images...${NC}"
docker image prune -f
echo -e "${GREEN}✅ Cleanup abgeschlossen${NC}"

# Status Report
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DEPLOYMENT ERFOLGREICH!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Deployment-Details:${NC}"
echo "   🌐 URL: http://localhost:5000"
echo "   🏥 Health: http://localhost:5000/health"
echo "   📝 Logs: docker-compose logs -f helix-app"
echo "   🔄 Status: docker-compose ps"
echo ""
echo -e "${BLUE}🔧 Nützliche Befehle:${NC}"
echo "   docker-compose logs -f          # Live-Logs anzeigen"
echo "   docker-compose restart          # Services neu starten"
echo "   docker-compose down             # Services stoppen"
echo "   docker-compose ps               # Status anzeigen"
echo ""
echo -e "${GREEN}🎉 HELIX ist bereit für den Produktivbetrieb!${NC}"
echo ""
