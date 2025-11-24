#!/usr/bin/env node
// Windows-kompatibler Server-Start für Produktionsumgebung

import { spawn } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';

console.log('🚀 Server Start mit Cache-Optimierungen...');

// Windows-kompatible Pfade
const tmpDir = tmpdir();
const cacheDir = path.join(tmpDir, '.helix-cache');

// Set NPM_CONFIG_CACHE environment variable and additional variables for Node.js module access
process.env.NODE_ENV = 'production';
process.env.NPM_CONFIG_CACHE = path.join(cacheDir, '.npm-isolated-cache');
process.env.NODE_OPTIONS = '--max-old-space-size=4096 --max-semi-space-size=1024';
process.env.PORT = process.env.PORT || '5000';
process.env.NPM_CONFIG_GLOBALCONFIG = path.join(cacheDir, '.npmrc-isolated-global');
process.env.NPM_CONFIG_USERCONFIG = path.join(cacheDir, '.npmrc-isolated-user');
process.env.NPM_CONFIG_PREFIX = path.join(cacheDir, '.npm-isolated-prefix');
process.env.NPM_CONFIG_STORE_DIR = path.join(cacheDir, '.npm-isolated-store');
process.env.NODE_PATH = '';
process.env.HOME_CACHE_DIR = path.join(cacheDir, '.cache-isolated');
process.env.XDG_CACHE_HOME = path.join(cacheDir, '.cache-isolated');

console.log('✅ Produktions-Umgebung konfiguriert');
console.log(`🌐 Server startet auf Port ${process.env.PORT}`);

// Server-Prozess starten
const serverProcess = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: process.env
});

serverProcess.on('close', (code) => {
  console.log(`Server beendet mit Code ${code}`);
  process.exit(code);
});

serverProcess.on('error', (err) => {
  console.error('Server-Fehler:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server wird heruntergefahren...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Server wird beendet...');
  serverProcess.kill('SIGTERM');
});