#!/bin/bash
# HELIX V3 - Complete Backend Setup Script
# Run on server: bash helix-backend-setup.sh

set -e

echo "🚀 HELIX V3 Backend Installation"
echo "================================="
echo ""

# 1. Install Node.js 20
echo "📦 Step 1/9: Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
    echo "✅ Node.js installed: $(node --version)"
else
    echo "✅ Node.js already installed: $(node --version)"
fi

# 2. Install PM2
echo "📦 Step 2/9: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 > /dev/null 2>&1
    echo "✅ PM2 installed: $(pm2 --version)"
else
    echo "✅ PM2 already installed: $(pm2 --version)"
fi

# 3. Install PostgreSQL
echo "📦 Step 3/9: Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq > /dev/null 2>&1
    apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
    systemctl enable postgresql > /dev/null 2>&1
    systemctl start postgresql
    echo "✅ PostgreSQL installed: $(psql --version | head -1)"
else
    echo "✅ PostgreSQL already installed: $(psql --version | head -1)"
fi

# 4. Setup PostgreSQL database
echo "📦 Step 4/9: Setting up database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'helix'" | grep -q 1 && \
    echo "✅ Database 'helix' already exists" || \
    {
        sudo -u postgres psql << 'SQL'
CREATE DATABASE helix;
CREATE USER helix WITH ENCRYPTED PASSWORD 'helix_prod_2025!';
GRANT ALL PRIVILEGES ON DATABASE helix TO helix;
\c helix
GRANT ALL ON SCHEMA public TO helix;
ALTER DATABASE helix OWNER TO helix;
SQL
        echo "✅ Database 'helix' created"
    }

# 5. Create application directory
echo "📦 Step 5/9: Preparing application directory..."
mkdir -p /opt/helix
cd /opt/helix

# 6. Check if backend files exist
echo "📦 Step 6/9: Checking for backend files..."
if [ ! -f "/tmp/helix-backend.tar.gz" ]; then
    echo "❌ ERROR: Backend files not found!"
    echo ""
    echo "Please upload backend files first:"
    echo "  From local machine:"
    echo "  cd /l/HELIXV3/HELIXV3"
    echo "  tar -czf /tmp/helix-backend.tar.gz dist/ package*.json shared/ server/ migrations/ drizzle.config.ts"
    echo "  scp /tmp/helix-backend.tar.gz root@152.53.191.99:/tmp/"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Backend archive found, extracting..."
tar -xzf /tmp/helix-backend.tar.gz -C /opt/helix/
rm /tmp/helix-backend.tar.gz

# 7. Create environment file
echo "📦 Step 7/9: Creating environment configuration..."
if [ ! -f .env ]; then
    cat > .env << 'ENV'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://helix:helix_prod_2025!@localhost:5432/helix

# API Keys - CONFIGURE THESE MANUALLY
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=

# Email (optional)
SENDGRID_API_KEY=

# Session Secret
SESSION_SECRET=$(openssl rand -base64 32)
ENV
    echo "✅ Environment file created (.env)"
    echo "⚠️  Remember to add API keys later!"
else
    echo "✅ Environment file already exists"
fi

# 8. Install dependencies and run migrations
echo "📦 Step 8/9: Installing dependencies..."
npm ci --production --quiet
echo "✅ Dependencies installed"

echo "📦 Running database migrations..."
npm run db:push
echo "✅ Migrations completed"

# 9. Start PM2 service
echo "📦 Step 9/9: Starting backend service..."
pm2 delete helix-api 2>/dev/null || true
pm2 start dist/index.js \
    --name helix-api \
    --node-args="--max-old-space-size=2048" \
    --time \
    --log /var/log/helix-api.log \
    --error /var/log/helix-api-error.log

pm2 save
pm2 startup systemd -u root --hp /root | tail -n 1 | bash || true

echo ""
echo "═══════════════════════════════════════"
echo "🎉 Backend Installation Complete!"
echo "═══════════════════════════════════════"
echo ""
echo "📊 Service Status:"
pm2 status

echo ""
echo "🌐 Test URLs:"
echo "  Health: curl http://localhost:5000/health"
echo "  Frontend: http://152.53.191.99/"
echo ""
echo "📝 Logs:"
echo "  pm2 logs helix-api"
echo "  tail -f /var/log/helix-api.log"
echo ""
echo "⚠️  NEXT STEPS:"
echo "1. Configure API keys: nano /opt/helix/.env"
echo "2. Restart backend: pm2 restart helix-api"
echo "3. Check Nginx is configured (should already be done)"
echo ""
