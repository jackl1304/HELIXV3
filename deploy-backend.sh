#!/bin/bash
set -e

SERVER="root@152.53.191.99"
echo "🚀 HELIX Backend Deployment"
echo "============================"
echo ""

# 1. Database setup
echo "📦 Step 1/5: Database..."
ssh $SERVER << 'DB_SETUP'
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'helix'" | grep -q 1 || \
sudo -u postgres psql << 'EOF'
CREATE DATABASE helix;
CREATE USER helix WITH ENCRYPTED PASSWORD 'helix_prod_2025!';
GRANT ALL PRIVILEGES ON DATABASE helix TO helix;
\c helix
GRANT ALL ON SCHEMA public TO helix;
ALTER DATABASE helix OWNER TO helix;
EOF
echo "✅ Database configured"
DB_SETUP

# 2. Prepare backend files
echo "📦 Step 2/5: Creating archive..."
cd /l/HELIXV3/HELIXV3
# Ensure fresh build exists
npm run build >/dev/null 2>&1 || true
# Include server bundle and static frontend assets
tar -czf /tmp/helix-backend.tar.gz dist/index.js dist/public package.json drizzle.config.ts shared/ server/ migrations/ 2>/dev/null || true

# 3. Upload
echo "📦 Step 3/5: Uploading..."
scp /tmp/helix-backend.tar.gz $SERVER:/tmp/

# 4. Extract and configure
echo "📦 Step 4/5: Configuring on server..."
ssh $SERVER << 'SETUP'
mkdir -p /opt/helix
cd /opt/helix
tar -xzf /tmp/helix-backend.tar.gz
rm /tmp/helix-backend.tar.gz

cat > .env << 'ENV'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://helix:helix_prod_2025!@localhost:5432/helix
SESSION_SECRET=changeme_$(openssl rand -base64 16)
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=
ENV

# No lockfile present → use npm install, then prune
npm install
npm run db:push
npm prune --production || true
SETUP

# 5. Start PM2
echo "📦 Step 5/5: Starting service..."
ssh $SERVER << 'PM2_START'
cd /opt/helix
pm2 delete helix-api 2>/dev/null || true
pm2 start dist/index.js --name helix-api --time --cwd /opt/helix --update-env
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
pm2 status
PM2_START

# 6. Configure Nginx
echo "📦 Configuring Nginx..."
ssh $SERVER << 'NGINX'
cat > /etc/nginx/sites-available/helix << 'CONF'
server {
    listen 80;
    server_name 152.53.191.99;

    root /var/www/html;
    index index.html;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
CONF

ln -sf /etc/nginx/sites-available/helix /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
NGINX

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://152.53.191.99/"
echo "   Health: http://152.53.191.99/health"
echo ""
echo "📊 Check status:"
echo "   ssh $SERVER 'pm2 status'"
echo "   ssh $SERVER 'pm2 logs helix-api'"
