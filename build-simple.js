#!/usr/bin/env node

/**
 * Simple Production Build - Kein komplexes Bundling!
 *
 * Strategie:
 * 1. Frontend mit Vite bauen (funktioniert perfekt)
 * 2. Backend NICHT bundlen - verwende tsx direkt
 * 3. In Production: `tsx server/index.ts` (kein Bundle nötig)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🏗️  HELIX Production Build - Simple & Stable');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Step 1: Clean old builds
console.log('[1/3] Cleaning old build artifacts...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
console.log('✅ Clean complete\n');

// Step 2: Build Frontend with Vite
console.log('[2/3] Building Frontend with Vite...');
try {
  execSync('npx vite build --config vite.config.ts', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Frontend build complete\n');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 3: Verify dist/public exists
console.log('[3/3] Verifying build output...');
const distPublicPath = path.join(process.cwd(), 'dist', 'public');
if (!fs.existsSync(distPublicPath)) {
  console.error('❌ dist/public not found after Vite build');
  process.exit(1);
}

const indexHtmlPath = path.join(distPublicPath, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ dist/public/index.html not found');
  process.exit(1);
}

console.log('✅ Build verification passed');
console.log(`   - dist/public exists: ${fs.existsSync(distPublicPath)}`);
console.log(`   - index.html exists: ${fs.existsSync(indexHtmlPath)}`);

// Create production start instructions
const startInstructions = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Build Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend: ✅ Built in dist/public/
Backend:  ℹ️  No bundling needed (using tsx)

🚀 Production Start Options:

Option 1 (Recommended): Direct tsx
  $ tsx server/index.ts

Option 2: PM2 with tsx
  $ pm2 start tsx --name helix -- server/index.ts

Option 3: Docker
  $ docker-compose up -d

📋 Environment Requirements:
  - NODE_ENV=production
  - DATABASE_URL=<your-postgres-url>
  - PORT=5000 (or custom)

📝 Why no backend bundle?
  - tsx handles TypeScript directly (fast, reliable)
  - No ESM/CJS conflicts
  - Hot-reload in dev, same runtime in prod
  - Zero bundling complexity

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

console.log(startInstructions);

// Write start script for convenience
const startScript = `#!/bin/bash
# Production Start Script
export NODE_ENV=production
tsx server/index.ts
`;

fs.writeFileSync('start-production.sh', startScript, { mode: 0o755 });
console.log('✅ Created: start-production.sh\n');

console.log('🎊 Production build ready!\n');
