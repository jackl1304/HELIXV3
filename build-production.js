#!/usr/bin/env node

/**
 * Alternative production build script for Helix
 * This script creates a more self-contained build for deployment
 */

import { build } from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path'; // path-Modul importieren

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

// Lade den Inhalt der package.json zur Build-Zeit.
const packageJsonContent = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8');

async function buildForProduction() {
  console.log('[PROD-BUILD] Starting production build...');

  // 1. First build the frontend with Vite
  console.log('[PROD-BUILD] Building frontend...');
  execSync('npx vite build --config vite.config.ts', { stdio: 'inherit', cwd: process.cwd() });

  // 2. Build the backend with selective bundling
  console.log('[PROD-BUILD] Building backend...');

  // Bundle common problematic packages but keep Node.js built-ins external
  const bundlePackages = [
    'cors',
    'express',
    'drizzle-orm',
    'drizzle-zod',
    'zod',
    'nanoid',
    'memoizee',
    'archiver',
    'cheerio',
    'axios',
    'node-fetch'
  ];

  await build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    outfile: 'dist/index.js',
    platform: 'node',
    target: 'node18',
    format: 'esm', // Wechsel zu ESM als Build-Format
    // 'define' und 'banner' werden nicht mehr für den import.meta.url-Polyfill benötigt.
    // sourcemap: true, // Deaktiviert für schnelleren Build
    plugins: [
      // Hier könnten weitere Plugins hinzugefügt werden
    ],
    external: [
      'express',
      'vite',
      'drizzle-orm',
      'pg',
      'drizzle-zod',
      'zod',
      'node-cron',
      'cheerio',
      'axios',
      'form-data',
      'multer',
      'winston',
      'tsx',
      'chokidar',
      'fsevents',
      'shell-quote',
      'ws',
      'http-proxy',
      'sirv',
      'source-map-support',
      'dotenv',
      'agentkeepalive',
      'node-fetch',
      'pdf-parse',
      'mammoth',
      'xlsx',
      'langchain',
      '@langchain/community',
      '@langchain/core',
      '@langchain/openai',
      'hnswlib-node',
      'JSONStream',
      'es-module-lexer',
      'magic-string',
      'micromatch',
      'picocolors',
      'postcss',
      'rollup',
      'resolve',
      'source-map',
      'ws',
      '@babel/core',
      '@babel/preset-typescript',
      'lightningcss',
      'esbuild',
    ],
  });

  // 2b. Import-Skripte bündeln
  const importScripts = [
    'scripts/script-db.ts',
    'scripts/import-fda-510k.ts',
    'scripts/import-ema-news.ts',
    'scripts/import-who-guidance.ts',
    'scripts/import-mhra-updates.ts',
    'scripts/import-healthcanada-notices.ts',
    'scripts/import-tga-updates.ts',
    'scripts/import-pmda-announcements.ts'
  ];
  console.log('[PROD-BUILD] Bundling import scripts...');
  await build({
    entryPoints: importScripts,
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs', // Konsistent auf 'cjs' geändert
    outdir: 'dist/import-scripts',
    external: ['pg', '@neondatabase/serverless', 'drizzle-orm'],
  });

  // 3. Production package.json erstellen
  console.log('[PROD-BUILD] Creating production package.json...');
  const originalPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const prodDependencies = originalPackageJson.dependencies; // Definition hinzugefügt
  const productionPackageJson = {
    name: originalPackageJson.name,
    version: originalPackageJson.version,
    // "type": "module" entfernt, damit Node das CJS-Bundle korrekt lädt
    dependencies: prodDependencies, // prodDependencies verwenden
    scripts: {
      "start": "node -r dotenv/config index.js" // -r Flag für CJS verwenden
    }
  };

  fs.writeFileSync(
    path.join('dist', 'package.json'),
    JSON.stringify(productionPackageJson, null, 2)
  );

  // 4. Create deployment info
  const deployInfo = {
    buildTime: new Date().toISOString(),
    buildType: 'production-optimized',
    // bundledPackages: bundlePackages, // bundlePackages ist hier nicht im Scope
    externalPackages: Object.keys(prodDependencies),
    nodeVersion: process.version
  };

  fs.writeFileSync(
    path.join('dist', 'deploy-info.json'),
    JSON.stringify(deployInfo, null, 2)
  );

  console.log('✅ Production build completed successfully!');
  console.log('📦 Build artifacts:');
  console.log('  - dist/index.js (server bundle)');
  console.log('  - dist/public/ (frontend assets)');
  console.log('  - dist/package.json (production dependencies)');
  console.log('  - dist/import-scripts/* (gebündelte Import-Skripte)');
  console.log('  - dist/deploy-info.json (build information)');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildForProduction();
}

// Ensure script runs
buildForProduction();
