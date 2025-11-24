#!/bin/bash
# Direct SSH Deployment - ohne TAR-Upload
# SSH funktioniert jetzt - deploye direkt vom Git-Repo

set -e

echo "📦 Direktes SSH-Deployment nach Netcup..."

# Code per rsync oder git auf Server übertragen
ssh root@152.53.191.99 << 'ENDSSH'
set -e

echo "📦 Installiere System-Pakete..."
apt update
apt install -y git npm wget curl

echo "📦 Installiere PM2..."
npm install -g pm2

echo "📁 Clone/Update Repository..."
if [ -d "/opt/helix" ]; then
  cd /opt/helix
  git pull || echo "Kein Git-Repo, manuelles Setup nötig"
else
  mkdir -p /opt/helix
  cd /opt/helix
fi

echo "⚙️ Erstelle .env..."
cat > .env << 'EOFENV'
DATABASE_URL=postgresql://neondb_owner:npg_DnKbP4Wh5zLc@ep-delicate-butterfly-aghj0opi-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
PORT=5000
NODE_ENV=production
EOFENV

echo "📚 Node.js Version..."
node --version
npm --version

echo "✅ Server vorbereitet. Jetzt manuell Code hochladen via SCP oder Git."
echo "Dann: npm install && npm run build && pm2 start dist/index.js --name helix"

ENDSSH

echo ""
echo "✅ Server-Setup abgeschlossen!"
echo ""
echo "📋 NÄCHSTE SCHRITTE:"
echo ""
echo "1. Code hochladen (eine der Optionen):"
echo ""
echo "   Option A - Via rsync (empfohlen):"
echo "   rsync -av --exclude node_modules --exclude dist --exclude .git \\"
echo "     . root@152.53.191.99:/opt/helix/"
echo ""
echo "   Option B - Via SCP:"
echo "   tar -czf helix-src.tar.gz --exclude=node_modules --exclude=dist --exclude=.git ."
echo "   scp helix-src.tar.gz root@152.53.191.99:/opt/helix/"
echo "   ssh root@152.53.191.99 'cd /opt/helix && tar -xzf helix-src.tar.gz'"
echo ""
echo "   Option C - Via Git (wenn Repo public/deployed):"
echo "   ssh root@152.53.191.99 'cd /opt/helix && git clone <YOUR_REPO_URL> .'"
echo ""
echo "2. Build und Start auf dem Server:"
echo "   ssh root@152.53.191.99"
echo "   cd /opt/helix"
echo "   npm install"
echo "   npm run build"
echo "   pm2 start dist/index.js --name helix"
echo "   pm2 save"
echo ""
echo "3. Verify:"
echo "   curl http://152.53.191.99:5000/health"
echo ""
