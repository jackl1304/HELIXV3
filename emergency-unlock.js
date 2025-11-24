#!/usr/bin/env node
/**
 * Emergency HTTP Admin Endpoint
 * TEMPORÄR - nur für fail2ban unlock & setup trigger
 * Läuft auf Port 8888, wird von Nginx durchgereicht
 */

const http = require('http');
const { exec } = require('child_process');

const SECRET_KEY = 'helix_emergency_2025';
const PORT = 8888;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  // CORS für externe Aufrufe
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const secret = url.searchParams.get('secret');

  if (secret !== SECRET_KEY) {
    res.writeHead(403);
    res.end(JSON.stringify({ error: 'Invalid secret' }));
    return;
  }

  if (url.pathname === '/unlock-ip') {
    exec('fail2ban-client unban --all', (error, stdout, stderr) => {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: !error,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        message: 'fail2ban unban executed'
      }));
    });
  } else if (url.pathname === '/run-setup') {
    exec('bash /tmp/server-setup.sh', (error, stdout, stderr) => {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: !error,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        message: 'Setup script executed'
      }));
    });
  } else if (url.pathname === '/pm2-status') {
    exec('pm2 status --no-color', (error, stdout, stderr) => {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: !error,
        stdout: stdout.toString(),
        stderr: stderr.toString()
      }));
    });
  } else if (url.pathname === '/pm2-logs') {
    exec('pm2 logs helix-api --lines 50 --nostream --no-color', (error, stdout, stderr) => {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: !error,
        stdout: stdout.toString(),
        stderr: stderr.toString()
      }));
    });
  } else if (url.pathname === '/restart-ssh') {
    exec('systemctl restart ssh && ufw allow 22/tcp', (error, stdout, stderr) => {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: !error,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        message: 'SSH restarted and firewall updated'
      }));
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Unknown endpoint',
      available: [
        '/unlock-ip?secret=KEY',
        '/run-setup?secret=KEY',
        '/pm2-status?secret=KEY',
        '/pm2-logs?secret=KEY',
        '/restart-ssh?secret=KEY'
      ]
    }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Emergency admin server running on http://127.0.0.1:${PORT}`);
  console.log(`Secret key: ${SECRET_KEY}`);
});
