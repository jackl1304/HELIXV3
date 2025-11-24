#!/usr/bin/env python3
"""
Automated Helix V3 Deployment to Netcup Server
Handles SSH authentication and deployment automatically
"""

import paramiko
import sys
import time
from pathlib import Path

# Configuration
SERVER = "152.53.191.99"
USERNAME = "root"
PASSWORD = "7724@Serpha"
PORT = 22
LOCAL_BUILD = "helix-deploy-20251124-065422.tar.gz"
REMOTE_PATH = "/opt/helix"

ENV_CONTENT = """DATABASE_URL=postgresql://neondb_owner:npg_DnKbP4Wh5zLc@ep-delicate-butterfly-aghj0opi-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
PORT=5000
NODE_ENV=production
"""

def run_command(ssh, command, wait_time=2):
    """Execute command and return output"""
    print(f"→ {command}")
    stdin, stdout, stderr = ssh.exec_command(command, get_pty=True)
    time.sleep(wait_time)
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    if output:
        print(output)
    if error and 'warn' not in error.lower():
        print(f"Error: {error}", file=sys.stderr)
    return output

def main():
    try:
        print("🚀 Starte Helix V3 Deployment...")

        # Create SSH client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        print(f"📡 Verbinde zu {SERVER}...")
        ssh.connect(SERVER, PORT, USERNAME, PASSWORD, timeout=30,
                   auth_timeout=30, banner_timeout=30)
        print("✅ SSH Verbindung hergestellt")

        # Upload file
        print(f"📤 Lade {LOCAL_BUILD} hoch...")
        sftp = ssh.open_sftp()
        sftp.put(LOCAL_BUILD, f"/tmp/helix-deploy.tar.gz")
        sftp.close()
        print("✅ Upload abgeschlossen")

        # Install PM2
        print("📦 Installiere PM2...")
        run_command(ssh, "npm install -g pm2", wait_time=15)

        # Setup directory
        print("📁 Erstelle Verzeichnis...")
        run_command(ssh, f"mkdir -p {REMOTE_PATH}")

        # Create .env
        print("⚙️ Erstelle .env Datei...")
        run_command(ssh, f"cat > {REMOTE_PATH}/.env << 'EOFENV'\n{ENV_CONTENT}\nEOFENV")

        # Stop old instance
        print("⏹️ Stoppe alte Instanz...")
        run_command(ssh, "pm2 stop helix 2>/dev/null || true")

        # Clean old files
        print("🧹 Räume alte Dateien auf...")
        run_command(ssh, f"cd {REMOTE_PATH} && rm -rf dist node_modules package*.json helix-deploy*.tar.gz")

        # Extract build
        print("📦 Entpacke Build...")
        run_command(ssh, f"cd {REMOTE_PATH} && mv /tmp/helix-deploy.tar.gz . && tar -xzf helix-deploy.tar.gz", wait_time=5)

        # Install dependencies
        print("📚 Installiere Dependencies...")
        run_command(ssh, f"cd {REMOTE_PATH} && npm install --omit=dev", wait_time=30)

        # Start PM2
        print("▶️ Starte PM2...")
        run_command(ssh, f"cd {REMOTE_PATH} && pm2 start dist/index.js --name helix --env production", wait_time=5)

        # Save PM2 config
        print("💾 Speichere PM2 Config...")
        run_command(ssh, "pm2 save")

        # Check status
        print("📊 Status:")
        run_command(ssh, "pm2 status")

        # Show logs
        print("📋 Logs:")
        run_command(ssh, "pm2 logs helix --lines 15 --nostream")

        # Trigger import
        print("🔄 Triggere ersten Import...")
        time.sleep(3)
        run_command(ssh, "curl -X POST http://localhost:5000/api/source-import/trigger")

        # Verify health
        print("🏥 Health Check...")
        run_command(ssh, "curl -s http://localhost:5000/health")

        ssh.close()

        print("\n✅ Deployment erfolgreich abgeschlossen!")
        print(f"🌐 Dashboard: http://{SERVER}:5000/")
        print("\n📝 Nächste Schritte:")
        print("   - Öffne http://152.53.191.99:5000/ im Browser")
        print("   - Prüfe Dashboard-Metriken")
        print("   - Warte ~2 Min. auf ersten Import")

        return 0

    except paramiko.AuthenticationException:
        print("❌ Authentifizierung fehlgeschlagen - Passwort falsch?", file=sys.stderr)
        return 1
    except paramiko.SSHException as e:
        print(f"❌ SSH Fehler: {e}", file=sys.stderr)
        return 1
    except FileNotFoundError:
        print(f"❌ Datei nicht gefunden: {LOCAL_BUILD}", file=sys.stderr)
        print("Führe zuerst aus: npm run build", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"❌ Unerwarteter Fehler: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
