@echo off
REM Windows Batch Script für SCP Upload mit Passwort
REM Da sshpass unter Windows nicht verfügbar ist, nutzen wir PowerShell

echo Uploading helix-source.tar.gz to server...

powershell -Command "$password = ConvertTo-SecureString '7724@Serpha' -AsPlainText -Force; $cred = New-Object System.Management.Automation.PSCredential('root', $password); scp helix-source.tar.gz root@152.53.191.99:/tmp/"

echo.
echo Upload abgeschlossen!
echo.
echo Jetzt SSH-Verbindung öffnen und deployen:
echo ssh root@152.53.191.99
echo Passwort: 7724@Serpha
echo.
echo Dann auf dem Server:
echo cd /opt/helix
echo tar -xzf /tmp/helix-source.tar.gz
echo npm install
echo npm run build
echo pm2 start dist/index.js --name helix
