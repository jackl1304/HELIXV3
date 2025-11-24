#!/bin/bash
# Emergency Deploy - setzt Admin-Endpoint + Nginx-Proxy auf Server

set -e
SERVER="root@152.53.191.99"

echo "🚨 Emergency Admin Endpoint Deployment"
echo "======================================="

# Warte bis SSH verfügbar (max 3 Versuche mit alternativen Ports)
echo "📡 Checking SSH availability..."
for port in 22 2222 22000; do
  if timeout 3 ssh -p $port $SERVER "echo SSH_OK" 2>/dev/null | grep -q SSH_OK; then
    SSH_PORT=$port
    echo "✅ SSH available on port $SSH_PORT"
    break
  fi
done

if [ -z "$SSH_PORT" ]; then
  echo "❌ SSH not reachable on any port. Please use Netcup web console:"
  echo "   1. Login to Netcup Customer Control Panel"
  echo "   2. Select your server"
  echo "   3. Open Serial Console (VNC/Konsole)"
  echo "   4. Run: fail2ban-client unban --all"
  echo "   5. Run: bash /tmp/server-setup.sh"
  exit 1
fi

# Upload files
echo "📦 Uploading emergency admin endpoint..."
scp -P $SSH_PORT emergency-unlock.js $SERVER:/tmp/
scp -P $SSH_PORT server-setup.sh $SERVER:/tmp/

# Configure Nginx proxy
echo "📦 Configuring Nginx proxy for admin endpoint..."
ssh -p $SSH_PORT $SERVER << 'NGINX_SETUP'
# Start emergency endpoint
node /tmp/emergency-unlock.js &
ADMIN_PID=$!
echo $ADMIN_PID > /tmp/emergency-admin.pid

# Add Nginx location for admin endpoint
cat > /etc/nginx/sites-available/helix-admin << 'CONF'
server {
    listen 80;
    server_name _;

    # Emergency admin (TEMPORARY)
    location /emergency-admin/ {
        proxy_pass http://127.0.0.1:8888/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Main app proxy
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

    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
CONF

ln -sf /etc/nginx/sites-available/helix-admin /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "✅ Emergency admin endpoint active on port 8888"
echo "✅ Nginx proxying /emergency-admin/ → localhost:8888"
NGINX_SETUP

echo ""
echo "✅ Emergency setup complete!"
echo ""
echo "🌐 Available commands via HTTP:"
echo "   curl 'http://152.53.191.99/emergency-admin/unlock-ip?secret=helix_emergency_2025'"
echo "   curl 'http://152.53.191.99/emergency-admin/run-setup?secret=helix_emergency_2025'"
echo "   curl 'http://152.53.191.99/emergency-admin/pm2-status?secret=helix_emergency_2025'"
echo "   curl 'http://152.53.191.99/emergency-admin/restart-ssh?secret=helix_emergency_2025'"
echo ""
echo "⚠️  REMOVE after SSH is restored!"
