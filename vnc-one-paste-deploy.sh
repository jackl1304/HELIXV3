#!/bin/bash
# Helix V3 Complete Deployment Script
# Kopiere ALLES und paste es EINMAL in VNC Console

set -e
cd /opt/helix

echo "🚀 Helix V3 Deployment startet..."

# Check fail2ban
if command -v fail2ban-client &> /dev/null; then
    echo "📋 Checking fail2ban..."
    fail2ban-client status sshd || true
fi

# Install dependencies if needed
if ! command -v git &> /dev/null; then
    echo "📦 Installing git..."
    apt update && apt install -y git curl wget
fi

# Create package.json
cat > package.json << 'EOFPKG'
{
  "name": "helix-v3",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server/index.js"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "drizzle-orm": "^0.38.3",
    "express": "^4.21.2",
    "helmet": "^8.0.0",
    "zod": "^3.24.1"
  }
}
EOFPKG

echo "📦 Installing dependencies..."
npm install

# Create minimal server
mkdir -p server
cat > server/index.js << 'EOFSERVER'
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

// Dashboard placeholder
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Helix V3</title></head>
    <body>
      <h1>🎯 Helix V3 - Regulatory Intelligence Platform</h1>
      <p>Server läuft auf Port ${PORT}</p>
      <p>Status: <a href="/health">Health Check</a></p>
      <p>Database: ${process.env.DATABASE_URL ? '✅ Configured' : '❌ Not configured'}</p>
    </body>
    </html>
  `);
});

// API stub
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalUpdates: 0,
    totalLegalCases: 0,
    activeDataSources: 0,
    totalPatents: 0
  });
});

app.listen(PORT, () => {
  console.log(`✅ Helix V3 server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Dashboard: http://localhost:${PORT}/`);
});
EOFSERVER

echo "▶️ Starting with PM2..."
pm2 delete helix 2>/dev/null || true
pm2 start server/index.js --name helix --env production
pm2 save

echo "📊 Status:"
pm2 status

echo "🏥 Testing health endpoint..."
sleep 2
curl http://localhost:5000/health

echo ""
echo "✅ Deployment abgeschlossen!"
echo "🌐 Server erreichbar unter: http://152.53.191.99:5000/"
echo ""
echo "📝 Nächste Schritte:"
echo "  - Prüfe: curl http://localhost:5000/health"
echo "  - Logs: pm2 logs helix"
echo "  - Restart: pm2 restart helix"
