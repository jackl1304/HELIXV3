@echo off
REM Windows PowerShell Deployment-Skript für Netcup
REM Verwendet WinSCP oder PSCP für Upload

echo ========================================
echo HELIX Deployment nach Netcup (Windows)
echo ========================================
echo.

set SERVER=root@152.53.191.99
set REMOTE_DIR=/opt/helix
set ARCHIVE=helix-deploy-20251124-065453.tar.gz

echo [1/4] Pruefe SSH-Verbindung...
ssh -o ConnectTimeout=5 %SERVER% "echo SSH OK" 2>nul
if errorlevel 1 (
    echo.
    echo ========================================
    echo WARNUNG: SSH nicht erreichbar
    echo ========================================
    echo.
    echo Moegliche Ursachen:
    echo - Netcup Firewall blockiert SSH von deiner IP
    echo - Server ist offline
    echo - SSH-Port wurde geaendert
    echo.
    echo Alternativen:
    echo 1. Netcup VNC Console nutzen:
    echo    - Login auf https://www.servercontrolpanel.de/
    echo    - Server auswaehlen -^> VNC Console
    echo    - Im VNC Terminal:
    echo      cd /opt/helix
    echo      curl -O http://[DEINE_IP]:8000/%ARCHIVE%
    echo      # siehe unten fuer lokalen HTTP-Server
    echo.
    echo 2. Lokalen HTTP-Server starten:
    echo    python -m http.server 8000
    echo    # oder: npx http-server -p 8000
    echo.
    echo 3. Netcup Datei-Upload nutzen:
    echo    - Archive manuell hochladen
    echo    - Per VNC entpacken
    echo.
    pause
    exit /b 1
)

echo [2/4] Upload Build-Archiv...
scp %ARCHIVE% %SERVER%:/tmp/

echo [3/4] Deployment auf Server...
ssh %SERVER% "cd /opt/helix && tar -czf backup-$(date +%%Y%%m%%d-%%H%%M%%S).tar.gz dist/ .env 2>/dev/null; tar -xzf /tmp/%ARCHIVE%; cd dist && npm ci --production 2>&1 | grep -v 'npm warn'; pm2 restart helix || pm2 start index.js --name helix"

echo [4/4] Aufraeumen...
ssh %SERVER% "rm /tmp/%ARCHIVE%"

echo.
echo ========================================
echo Deployment abgeschlossen!
echo ========================================
echo.
echo Server Health: http://152.53.191.99:5000/health
echo Dashboard: http://152.53.191.99:5000/
echo.
echo Naechste Schritte:
echo 1. Import triggern:
echo    curl -X POST http://152.53.191.99:5000/api/source-import/trigger
echo.
echo 2. Logs pruefen:
echo    ssh %SERVER% "pm2 logs helix --lines 50"
echo.
pause
