#!/usr/bin/expect -f
set timeout 120
set password "KkZrHw5wrJJnn6TH"

spawn scp helix-deploy-20251124-065422.tar.gz root@152.53.191.99:/tmp/helix-deploy.tar.gz
expect "password:"
send "$password\r"
expect eof

spawn ssh root@152.53.191.99
expect "password:"
send "$password\r"
expect "# "

send "npm install -g pm2\r"
expect "# "

send "mkdir -p /opt/helix && cd /opt/helix\r"
expect "# "

send "cat > .env << 'ENVEOF'\r"
send "DATABASE_URL=postgresql://neondb_owner:npg_DnKbP4Wh5zLc@ep-delicate-butterfly-aghj0opi-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require\r"
send "PORT=5000\r"
send "NODE_ENV=production\r"
send "ENVEOF\r"
expect "# "

send "pm2 stop helix 2>/dev/null || true\r"
expect "# "

send "rm -rf dist node_modules package*.json\r"
expect "# "

send "mv /tmp/helix-deploy.tar.gz . && tar -xzf helix-deploy.tar.gz\r"
expect "# "

send "npm install --omit=dev\r"
expect "# " timeout 180

send "pm2 start dist/index.js --name helix --env production\r"
expect "# "

send "pm2 save\r"
expect "# "

send "pm2 logs helix --lines 10\r"
expect "# " timeout 5

send "curl -X POST http://localhost:5000/api/source-import/trigger\r"
expect "# "

send "exit\r"
expect eof
