#!/bin/bash
set -e

SERVER="root@152.53.191.99"
REMOTE_DIR="/opt/helix"

echo "🚀 HELIX V3 Full Deployment zu Netcup"
echo "========================================"

# 1. Backend-Dateien hochladen
echo "📤 Uploading backend files..."

# Erstelle Verzeichnis auf Server
ssh $SERVER "mkdir -p $REMOTE_DIR"

# Tar-basierter Upload (rsync-Alternative für Windows)
echo "Creating archive..."
tar -czf /tmp/helix-backend.tar.gz \
  --exclude='node_modules' \
  --exclude='client' \
  --exclude='.git' \
  --exclude='.vscode' \
  --exclude='dist/public' \
  --exclude='*.log' \
  dist/ package*.json drizzle.config.ts shared/ server/ migrations/ scripts/ 2>/dev/null || true

echo "Uploading archive..."
scp /tmp/helix-backend.tar.gz $SERVER:/tmp/

echo "Extracting on server..."
ssh $SERVER "cd $REMOTE_DIR && tar -xzf /tmp/helix-backend.tar.gz && rm /tmp/helix-backend.tar.gz"

echo "✅ Backend files uploaded"

# 2. Server Setup Script hochladen und ausführen
cat > /tmp/helix-setup.sh << 'SETUP_SCRIPT'
#!/bin/bash
set -e

echo "🔧 Installing system dependencies..."

# Node.js 20
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# PostgreSQL
if ! command -v psql &> /dev/null; then
    apt-get update
    apt-get install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl enable nginx
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo "✅ System dependencies installed"

# PostgreSQL Database Setup
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'helix'" | grep -q 1 || \
sudo -u postgres psql << EOF
CREATE DATABASE helix;
CREATE USER helix WITH ENCRYPTED PASSWORD 'helix_prod_2025!';
GRANT ALL PRIVILEGES ON DATABASE helix TO helix;
\c helix
GRANT ALL ON SCHEMA public TO helix;
ALTER DATABASE helix OWNER TO helix;
EOF

echo "✅ Database created"

# Install backend dependencies
cd /opt/helix
echo "📦 Installing Node.js dependencies..."
npm ci --production

# Generate .env if not exists
if [ ! -f .env ]; then
    cat > .env << ENV
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://helix:helix_prod_2025!@localhost:5432/helix

# API Keys (TO BE CONFIGURED)
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=

# Email (optional)
SENDGRID_API_KEY=

# Session
SESSION_SECRET=$(openssl rand -base64 32)
ENV
    echo "⚠️  .env created - CONFIGURE API KEYS MANUALLY!"
fi

echo "✅ Backend setup complete"
SETUP_SCRIPT

echo "📤 Uploading setup script..."
scp /tmp/helix-setup.sh $SERVER:/tmp/helix-setup.sh

echo "🔧 Running server setup..."
ssh $SERVER "bash /tmp/helix-setup.sh"

# 3. Run migrations
echo "🗄️ Running database migrations..."
ssh $SERVER "cd $REMOTE_DIR && npm run db:push"

# 4. Start PM2 service
echo "🚀 Starting PM2 service..."
ssh $SERVER << 'PM2_SETUP'
cd /opt/helix

# Stop existing instance if running
pm2 delete helix-api 2>/dev/null || true

# Start new instance
pm2 start dist/index.js \
  --name helix-api \
  --node-args="--max-old-space-size=2048" \
  --time \
  --log /var/log/helix-api.log \
  --error /var/log/helix-api-error.log

# Save PM2 config and setup startup
pm2 save
pm2 startup systemd -u root --hp /root
PM2_SETUP

echo "✅ PM2 service started"

# 5. Configure Nginx
echo "🌐 Configuring Nginx..."
ssh $SERVER << 'NGINX_SETUP'
cat > /etc/nginx/sites-available/helix << 'NGINXCONF'
server {
    listen 80;
    server_name 152.53.191.99;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (static files)
    root /var/www/html;
    index index.html;

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # WebSocket support (if needed)
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # SPA fallback for frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Logging
    access_log /var/log/nginx/helix-access.log;
    error_log /var/log/nginx/helix-error.log;
}
NGINXCONF

# Enable site
ln -sf /etc/nginx/sites-available/helix /etc/nginx/sites-enabled/helix
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t && systemctl reload nginx
NGINX_SETUP

echo "✅ Nginx configured"

# 6. Setup firewall
echo "🔒 Configuring firewall..."
ssh $SERVER << 'FIREWALL_SETUP'
if ! command -v ufw &> /dev/null; then
    apt-get install -y ufw
fi

ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status
FIREWALL_SETUP

echo "✅ Firewall configured"

# 7. Final status check
echo ""
echo "🎉 Deployment Complete!"
echo "========================"
echo ""
echo "Frontend: http://152.53.191.99/"
echo "API Health: http://152.53.191.99/health"
echo ""
echo "📊 Service Status:"
ssh $SERVER "pm2 status && systemctl status nginx --no-pager -l"

echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Configure API keys in /opt/helix/.env on server"
echo "2. Restart backend: ssh $SERVER 'pm2 restart helix-api'"
echo "3. Setup SSL: ssh $SERVER 'certbot --nginx -d your-domain.de'"
echo "4. Change database password in production"
echo ""
echo "📝 Logs:"
echo "Backend: ssh $SERVER 'pm2 logs helix-api'"
echo "Nginx: ssh $SERVER 'tail -f /var/log/nginx/helix-error.log'"
echo ""
