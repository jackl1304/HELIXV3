#!/bin/bash
set -e

echo "🔧 Setting up Helix backend..."

# Database
echo "📦 Database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'helix'" | grep -q 1 || sudo -u postgres psql << 'EOF'
CREATE DATABASE helix;
CREATE USER helix WITH ENCRYPTED PASSWORD 'helix_prod_2025!';
GRANT ALL PRIVILEGES ON DATABASE helix TO helix;
\c helix
GRANT ALL ON SCHEMA public TO helix;
ALTER DATABASE helix OWNER TO helix;
EOF

# Extract
echo "📦 Extracting..."
mkdir -p /opt/helix
cd /opt/helix
tar -xzf /tmp/helix-backend.tar.gz
rm /tmp/helix-backend.tar.gz

# Environment
echo "📦 Environment..."
cat > .env << 'ENV'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://helix:helix_prod_2025!@localhost:5432/helix
SESSION_SECRET=changeme_prod_secret_2025
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=
ENV

# Dependencies & DB
echo "📦 Installing..."
# No package-lock present → use npm install, then prune
npm install
npm run db:push
npm prune --production || true

# PM2
echo "📦 Starting service..."
pm2 delete helix-api 2>/dev/null || true
pm2 start dist/index.js --name helix-api --time --cwd /opt/helix --update-env
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# Nginx
echo "📦 Nginx..."
cat > /etc/nginx/sites-available/helix << 'CONF'
server {
    listen 80;
    server_name _;

    # Helix runs as single Node process (API + static)
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: dedicated health passthrough
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
CONF

ln -sf /etc/nginx/sites-available/helix /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "✅ Setup complete!"
pm2 status
