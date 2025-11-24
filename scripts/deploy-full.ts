import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SERVER = 'root@152.53.191.99';
const REMOTE_DIR = '/opt/helix';

async function exec(cmd: string, args: string[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { shell: true, stdio: ['inherit', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    proc.stderr?.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`Command failed: ${cmd}\nStderr: ${stderr}`));
    });
  });
}

async function sshExec(command: string): Promise<string> {
  console.log(`🔧 Running on server: ${command.substring(0, 60)}...`);
  return exec('ssh', ['-o', 'StrictHostKeyChecking=no', SERVER, command]);
}

async function main() {
  console.log('🚀 HELIX V3 Complete Netcup Deployment');
  console.log('=========================================\n');

  // 1. Server-Setup
  console.log('📦 Step 1/8: Installing system dependencies...');
  await sshExec(`
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq

    # Node.js 20
    if ! command -v node &> /dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
      apt-get install -y nodejs > /dev/null 2>&1
    fi

    # PostgreSQL
    if ! command -v psql &> /dev/null; then
      apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
      systemctl enable postgresql > /dev/null 2>&1
      systemctl start postgresql
    fi

    # Nginx
    if ! command -v nginx &> /dev/null; then
      apt-get install -y nginx > /dev/null 2>&1
      systemctl enable nginx > /dev/null 2>&1
    fi

    # PM2
    if ! command -v pm2 &> /dev/null; then
      npm install -g pm2 > /dev/null 2>&1
    fi

    node --version && nginx -v && pm2 --version && psql --version
  `);
  console.log('✅ System dependencies installed\n');

  // 2. PostgreSQL Setup
  console.log('📦 Step 2/8: Setting up PostgreSQL...');
  await sshExec(`
    sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'helix'" | grep -q 1 || \
    sudo -u postgres psql << 'EOF'
CREATE DATABASE helix;
CREATE USER helix WITH ENCRYPTED PASSWORD 'helix_prod_2025!';
GRANT ALL PRIVILEGES ON DATABASE helix TO helix;
\\c helix
GRANT ALL ON SCHEMA public TO helix;
ALTER DATABASE helix OWNER TO helix;
EOF
    echo "Database ready"
  `);
  console.log('✅ Database configured\n');

  // 3. Create remote directory
  console.log('📦 Step 3/8: Preparing remote directory...');
  await sshExec(`mkdir -p ${REMOTE_DIR} && rm -rf ${REMOTE_DIR}/* && echo "Directory ready"`);
  console.log('✅ Directory prepared\n');

  // 4. Upload backend files
  console.log('📦 Step 4/8: Uploading backend files...');

  // Create archive
  console.log('Creating archive...');
  await exec('tar', [
    '-czf', '/tmp/helix-backend.tar.gz',
    '--exclude=node_modules',
    '--exclude=client',
    '--exclude=.git',
    '--exclude=.vscode',
    '--exclude=dist/public',
    '--exclude=*.log',
    'dist/',
    'package.json',
    'package-lock.json',
    'drizzle.config.ts',
    'shared/',
    'server/',
    'migrations/'
  ]);

  // Upload archive
  console.log('Uploading...');
  await exec('scp', ['-o', 'StrictHostKeyChecking=no', '/tmp/helix-backend.tar.gz', `${SERVER}:/tmp/`]);

  // Extract on server
  console.log('Extracting...');
  await sshExec(`cd ${REMOTE_DIR} && tar -xzf /tmp/helix-backend.tar.gz && rm /tmp/helix-backend.tar.gz`);
  console.log('✅ Backend files uploaded\n');

  // 5. Configure environment
  console.log('📦 Step 5/8: Configuring environment...');
  await sshExec(`
    cd ${REMOTE_DIR}
    if [ ! -f .env ]; then
      cat > .env << 'ENV'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://helix:helix_prod_2025!@localhost:5432/helix

# API Keys (CONFIGURE THESE)
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=

# Email (optional)
SENDGRID_API_KEY=

# Session
SESSION_SECRET=$(openssl rand -base64 32)
ENV
      echo "Environment file created"
    else
      echo "Environment file exists"
    fi
  `);
  console.log('✅ Environment configured\n');

  // 6. Install dependencies and run migrations
  console.log('📦 Step 6/8: Installing dependencies and migrating database...');
  await sshExec(`
    cd ${REMOTE_DIR}
    npm ci --production --quiet
    npm run db:push
  `);
  console.log('✅ Dependencies installed and migrations run\n');

  // 7. Configure and start PM2
  console.log('📦 Step 7/8: Starting PM2 service...');
  await sshExec(`
    cd ${REMOTE_DIR}
    pm2 delete helix-api 2>/dev/null || true
    pm2 start dist/index.js --name helix-api --node-args="--max-old-space-size=2048" --time
    pm2 save
    pm2 startup systemd -u root --hp /root | tail -n 1 | bash || true
    pm2 status
  `);
  console.log('✅ PM2 service started\n');

  // 8. Configure Nginx
  console.log('📦 Step 8/8: Configuring Nginx...');
  await sshExec(`
    cat > /etc/nginx/sites-available/helix << 'NGINXCONF'
server {
    listen 80;
    server_name 152.53.191.99;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    root /var/www/html;
    index index.html;

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }

    # SPA fallback
    location / {
        try_files \\$uri \\$uri/ /index.html;
    }

    access_log /var/log/nginx/helix-access.log;
    error_log /var/log/nginx/helix-error.log;
}
NGINXCONF

    ln -sf /etc/nginx/sites-available/helix /etc/nginx/sites-enabled/helix
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
  `);
  console.log('✅ Nginx configured\n');

  // Final status
  console.log('═══════════════════════════════════════');
  console.log('🎉 Deployment Complete!');
  console.log('═══════════════════════════════════════\n');

  console.log('🌐 URLs:');
  console.log('   Frontend: http://152.53.191.99/');
  console.log('   API Health: http://152.53.191.99/health\n');

  console.log('📊 Service Status:');
  await sshExec('pm2 status && echo "" && systemctl status nginx --no-pager | head -5');

  console.log('\n⚠️  NEXT STEPS:');
  console.log('1. Configure API keys: ssh root@152.53.191.99 "nano /opt/helix/.env"');
  console.log('2. Restart backend: ssh root@152.53.191.99 "pm2 restart helix-api"');
  console.log('3. View logs: ssh root@152.53.191.99 "pm2 logs helix-api"');
  console.log('4. Setup SSL: ssh root@152.53.191.99 "certbot --nginx -d your-domain.de"');
}

main().catch(err => {
  console.error('\n❌ Deployment failed:', err.message);
  process.exit(1);
});
