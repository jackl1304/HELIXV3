#!/bin/bash
# Minimal unlock via existing Nginx - nutzt CGI oder direkten Shell-Zugriff

cat > /tmp/unlock-via-http.sh << 'SCRIPT'
#!/bin/bash
# Dieses Skript wird auf dem Server via Web-Console ausgeführt

echo "🚨 Emergency Unlock & Setup"
echo "==========================="

# 1. Entsperre alle IPs in fail2ban
echo "📦 Unlocking fail2ban..."
fail2ban-client unban --all
fail2ban-client status sshd

# 2. Firewall check
echo "📦 Checking firewall..."
ufw status
ufw allow 22/tcp

# 3. SSH restart
echo "📦 Restarting SSH..."
systemctl restart ssh
systemctl status ssh --no-pager -l

# 4. Setup ausführen falls vorhanden
if [ -f /tmp/server-setup.sh ]; then
  echo "📦 Running setup script..."
  bash /tmp/server-setup.sh
else
  echo "⚠️  /tmp/server-setup.sh not found - upload it first"
fi

echo ""
echo "✅ Emergency unlock complete!"
echo "Try SSH now: ssh root@152.53.191.99"
SCRIPT

chmod +x /tmp/unlock-via-http.sh

echo "📄 Emergency script created: /tmp/unlock-via-http.sh"
echo ""
echo "NEXT STEPS - Use Netcup Web Console:"
echo "===================================="
echo "1. Login: https://www.customercontrolpanel.de/"
echo "2. Navigate: Produkte → Server → VServer → [Your Server]"
echo "3. Click: 'Konsole' or 'VNC-Konsole' or 'Serial Console'"
echo "4. Login as root (password: 7724@Serpha)"
echo "5. Run: bash /tmp/unlock-via-http.sh"
echo ""
echo "Alternative - if you already have shell access:"
echo "scp /tmp/unlock-via-http.sh root@152.53.191.99:/tmp/ && ssh root@152.53.191.99 'bash /tmp/unlock-via-http.sh'"
