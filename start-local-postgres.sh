#!/bin/bash
# Quick Setup: Postgres für lokale Entwicklung mit Docker

echo "🔍 Prüfe ob Docker verfügbar ist..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nicht gefunden!"
    echo ""
    echo "Installationsoptionen:"
    echo "1. Docker Desktop: https://www.docker.com/products/docker-desktop/"
    echo "2. Neon Database (Cloud): https://neon.tech (empfohlen für Windows)"
    echo ""
    exit 1
fi

echo "🚀 Starte PostgreSQL Container..."
docker run -d \
  --name helix-postgres \
  -e POSTGRES_USER=helix \
  -e POSTGRES_PASSWORD=helix_prod_2025! \
  -e POSTGRES_DB=helix \
  -p 5432:5432 \
  postgres:17-alpine

echo ""
echo "⏳ Warte 5 Sekunden auf Postgres-Start..."
sleep 5

echo "✅ PostgreSQL läuft!"
echo ""
echo "Connection String:"
echo "postgresql://helix:helix_prod_2025!@localhost:5432/helix"
echo ""
echo "Nächste Schritte:"
echo "1. Schema pushen: npm run db:push"
echo "2. Import testen: npx tsx scripts/import-fda-510k.ts --limit=10"
echo ""
echo "Stop: docker stop helix-postgres"
echo "Start: docker start helix-postgres"
echo "Logs: docker logs helix-postgres"
