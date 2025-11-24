const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SERVER = '152.53.191.99';
const PASSWORD = 'KkZrHw5wrJJnn6TH';
const BUILD_FILE = 'helix-deploy-20251124-065422.tar.gz';

console.log('🚀 Helix V3 Automated Deployment\n');

// Create temporary script for SSH
const sshScript = `
set -e

echo "📦 Installiere PM2..."
npm install -g pm2

echo "📁 Erstelle Verzeichnis..."
mkdir -p /opt/helix
cd /opt/helix

echo "⚙️ Erstelle .env..."
cat > .env << 'EOFENV'
DATABASE_URL=postgresql://neondb_owner:npg_DnKbP4Wh5zLc@ep-delicate-butterfly-aghj0opi-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
PORT=5000
NODE_ENV=production
EOFENV

echo "⏹️ Stoppe alte Instanz..."
pm2 stop helix 2>/dev/null || true

echo "🧹 Räume auf..."
rm -rf dist node_modules package*.json helix-deploy*.tar.gz

echo "📦 Entpacke Build..."
tar -xzf /tmp/helix-deploy.tar.gz

echo "📚 Installiere Dependencies..."
npm install --omit=dev

echo "▶️ Starte PM2..."
pm2 start dist/index.js --name helix --env production

echo "💾 Speichere PM2..."
pm2 save

echo "📊 Status:"
pm2 status

echo "📋 Logs:"
pm2 logs helix --lines 10 --nostream

echo "🔄 Triggere Import..."
sleep 2
curl -X POST http://localhost:5000/api/source-import/trigger || true

echo "🏥 Health Check..."
curl -s http://localhost:5000/health || true

echo ""
echo "✅ Deployment abgeschlossen!"
`;

fs.writeFileSync('deploy-script.sh', sshScript);

try {
  console.log(`📤 Uploading ${BUILD_FILE}...`);
  
  // Use PowerShell with SecureString for password
  const psUpload = `
    $password = ConvertTo-SecureString "${PASSWORD}" -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential ("root", $password)
    
    # Upload file
    & scp -o StrictHostKeyChecking=no "${BUILD_FILE}" root@${SERVER}:/tmp/helix-deploy.tar.gz
    
    # Upload script
    & scp -o StrictHostKeyChecking=no deploy-script.sh root@${SERVER}:/tmp/deploy-script.sh
    
    # Execute script
    & ssh -o StrictHostKeyChecking=no root@${SERVER} "bash /tmp/deploy-script.sh"
  `.replace(/\${PASSWORD}/g, PASSWORD)
     .replace(/\${SERVER}/g, SERVER)
     .replace(/\${BUILD_FILE}/g, BUILD_FILE);
  
  // For Git Bash, try using SSH with redirected password
  console.log('Versuche Upload via SSH...');
  
  // Method 1: Try with expect if available
  try {
    const expectScript = `
spawn scp -o StrictHostKeyChecking=no ${BUILD_FILE} root@${SERVER}:/tmp/helix-deploy.tar.gz
expect "password:"
send "${PASSWORD}\\r"
expect eof

spawn scp -o StrictHostKeyChecking=no deploy-script.sh root@${SERVER}:/tmp/deploy-script.sh  
expect "password:"
send "${PASSWORD}\\r"
expect eof

spawn ssh -o StrictHostKeyChecking=no root@${SERVER} "bash /tmp/deploy-script.sh"
expect "password:"
send "${PASSWORD}\\r"
expect eof
`;
    
    fs.writeFileSync('deploy.exp', expectScript);
    execSync('expect deploy.exp', { stdio: 'inherit' });
    
  } catch (e) {
    console.log('\n❌ Automatisches Deployment nicht möglich (expect fehlt)');
    console.log('\n📋 MANUELLE DEPLOYMENT-SCHRITTE:\n');
    console.log('1. Öffne PowerShell oder PuTTY');
    console.log(`2. ssh root@${SERVER}`);
    console.log(`   Passwort: ${PASSWORD}`);
    console.log('\n3. Kopiere und führe aus:\n');
    console.log('   wget http://192.168.178.85:8000/helix-deploy-20251124-065422.tar.gz -O /tmp/helix-deploy.tar.gz');
    console.log('\n4. Dann:');
    console.log(sshScript);
    console.log('\n📄 Oder nutze das Script: cat COMPLETE_SERVER_DEPLOY.sh\n');
  }
  
} catch (error) {
  console.error('❌ Fehler:', error.message);
  console.log('\n📋 FALLBACK - Manuelle Schritte siehe COMPLETE_SERVER_DEPLOY.sh');
  process.exit(1);
}
