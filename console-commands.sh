#!/bin/bash
# Direkte Befehle für die Netcup Console

# 1. fail2ban starten (falls nicht läuft)
systemctl start fail2ban 2>/dev/null || echo "fail2ban nicht installiert oder bereits aktiv"

# 2. Firewall prüfen und SSH sicherstellen
ufw allow 22/tcp 2>/dev/null || echo "ufw nicht aktiv"

# 3. SSH-Service sicherstellen
systemctl restart ssh
systemctl status ssh --no-pager | head -n 10

# 4. Setup-Skript hochladen prüfen
if [ ! -f /tmp/server-setup.sh ]; then
  echo "⚠️  /tmp/server-setup.sh fehlt - wird gleich hochgeladen"
else
  echo "✅ Setup-Skript gefunden"
  bash /tmp/server-setup.sh
fi

echo ""
echo "✅ SSH sollte jetzt erreichbar sein"
echo "Test mit: ssh root@152.53.191.99"
