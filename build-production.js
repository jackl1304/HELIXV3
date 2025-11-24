#!/usr/bin/env node

/**
 * Alternative production build script for Helix
 * This script creates a more self-contained build for deployment
 */

import { build } from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const log = (message) => console.log(`[PROD-BUILD] ${message}`);

async function buildForProduction() {
  try {
    log('Starting production build...');

    // 1. First build the frontend with Vite
    log('Building frontend...');
    execSync('npx vite build --config vite.config.ts', { stdio: 'inherit', cwd: process.cwd() });

    // 2. Build the backend with selective bundling
    log('Building backend...');

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
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outdir: 'dist',
      external: [
        // Keep ONLY Node.js built-ins external - bundle everything else
        'fs', 'path', 'http', 'https', 'crypto', 'os', 'url', 'util', 
        'events', 'stream', 'buffer', 'querystring', 'child_process',
        'dns', 'net', 'tls', 'zlib', 'assert', 'constants', 'module',
        'worker_threads', 'perf_hooks', 'v8', 'vm', 'async_hooks',
        // These have native dependencies and can't be bundled
        'lightningcss', '@babel/preset-typescript', '@babel/preset-typescript/package.json'
      ],
      define: {
        'import.meta.url': 'import.meta.url'
      },
      banner: {
        js: ''
      }
    });

    // 2b. Bundle Import Scripts (regulatory source ingestion) für Betrieb ohne devDependencies
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
    log('Bundling import scripts...');
    await build({
      entryPoints: importScripts,
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outdir: 'dist/import-scripts',
      external: [
        'fs','path','http','https','crypto','os','url','util','events','stream','buffer','querystring','child_process',
        'nodemailer','@anthropic-ai/sdk','openai','@sendgrid/mail','winston','pg','@neondatabase/serverless','passport','passport-local','express-session','connect-pg-simple','memorystore'
        ,'lightningcss','@babel/preset-typescript','@babel/preset-typescript/package.json'
      ],
      banner: { js: '' }
    });

    // 3. Create a minimal package.json for production
    log('Creating production package.json...');

    const originalPkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

    // MINIMAL dependencies - everything else is bundled
    const prodDependencies = {};

    const prodPackage = {
      name: originalPkg.name,
      version: originalPkg.version,
      type: 'module',
      scripts: {
        start: 'node index.js'
      },
      dependencies: prodDependencies
    };

    fs.writeFileSync(
      path.join('dist', 'package.json'),
      JSON.stringify(prodPackage, null, 2)
    );

    // 4. Create deployment info
    const deployInfo = {
      buildTime: new Date().toISOString(),
      buildType: 'production-optimized',
      bundledPackages: bundlePackages,
      externalPackages: Object.keys(prodDependencies),
      nodeVersion: process.version
    };

    fs.writeFileSync(
      path.join('dist', 'deploy-info.json'),
      JSON.stringify(deployInfo, null, 2)
    );

    log('✅ Production build completed successfully!');
    log('📦 Build artifacts:');
    log('  - dist/index.js (server bundle)');
    log('  - dist/public/ (frontend assets)');
    log('  - dist/package.json (production dependencies)');
    log('  - dist/import-scripts/* (gebündelte Import-Skripte)');
    log('  - dist/deploy-info.json (build information)');

  } catch (error) {
    log(`❌ Production build failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildForProduction();
}

// Ensure script runs
buildForProduction();
