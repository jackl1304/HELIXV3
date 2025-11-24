
set -e

echo "📦 Installiere PM2..."
npm install -g pm2

echo "📁 Erstelle Verzeichnis..."
mkdir -p /opt/helix
cd /opt/helix

echo "⚙️ Erstelle .env..."
cat > .env << 'EOFENV'
DATABASE_URL=postgresql://neondb_owner:npg_DnKbP4Wh5zLc@ep-delicate-butterfly-aghj0opi-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
PORT=5000
NODE_ENV=production
EOFENV

echo "⏹️ Stoppe alte Instanz..."
pm2 stop helix 2>/dev/null || true

echo "🧹 Räume auf..."
rm -rf dist node_modules package*.json helix-deploy*.tar.gz

echo "📦 Entpacke Build..."
tar -xzf /tmp/helix-deploy.tar.gz

echo "📚 Installiere Dependencies..."
npm install --omit=dev

echo "▶️ Starte PM2..."
pm2 start dist/index.js --name helix --env production

echo "💾 Speichere PM2..."
pm2 save

echo "📊 Status:"
pm2 status

echo "📋 Logs:"
pm2 logs helix --lines 10 --nostream

echo "🔄 Triggere Import..."
sleep 2
curl -X POST http://localhost:5000/api/source-import/trigger || true

echo "🏥 Health Check..."
curl -s http://localhost:5000/health || true

echo ""
echo "✅ Deployment abgeschlossen!"
