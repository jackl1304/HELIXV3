#!/bin/bash
# Helix V3 Production Deployment via Git
# Kopiere ALLES und paste es EINMAL in VNC Console

set -e

echo "🚀 Helix V3 Deployment startet..."

# Check if directory exists, create if not
if [ ! -d "/opt/helix" ]; then
    echo "📁 Creating /opt/helix directory..."
    mkdir -p /opt/helix
    cd /opt/helix
    
    echo "📥 Cloning repository..."
    git clone https://github.com/jackl1304/HELIXV3.git .
else
    cd /opt/helix
    echo "📥 Updating repository..."
    git fetch origin
    git reset --hard origin/main
fi

# Check if .env exists, if not copy from env.setup
if [ ! -f ".env" ]; then
    if [ -f "env.setup" ]; then
        echo "⚙️ Creating .env from env.setup..."
        cp env.setup .env
        echo "⚠️  WICHTIG: Bitte DATABASE_URL in .env konfigurieren!"
    else
        echo "⚠️  Keine .env gefunden - bitte manuell erstellen!"
    fi
fi

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 if needed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

echo "▶️ Starting with PM2..."
pm2 delete helix-app 2>/dev/null || true
pm2 start dist/index.js --name helix-app --node-args="--max-old-space-size=2048"
pm2 save
pm2 startup

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🏥 Testing health endpoint..."
sleep 3
curl -f http://localhost:5000/health || echo "⚠️  Health check failed"

echo ""
echo "✅ Deployment abgeschlossen!"
echo "🌐 Server sollte erreichbar sein unter: http://152.53.191.99:5000/"
echo ""
echo "📝 Wichtige Befehle:"
echo "  - Status: pm2 status"
echo "  - Logs: pm2 logs helix-app"
echo "  - Restart: pm2 restart helix-app"
echo "  - Stop: pm2 stop helix-app"
echo "  - Update: cd /opt/helix && git pull && pm2 restart helix-app"
echo ""
echo "⚙️  Falls Server nicht läuft:"
echo "  1. Prüfe .env Datei: cat /opt/helix/.env"
echo "  2. Prüfe Logs: pm2 logs helix-app --lines 50"
echo "  3. Manueller Start: cd /opt/helix && node dist/index.js"
