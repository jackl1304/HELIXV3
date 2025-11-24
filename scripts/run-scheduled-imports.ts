/**
 * Scheduled Regulatory Import Runner
 * Orchestriert automatische Updates aus globalen Quellen
 *
 * Verwendung:
 * - Lokal: node_modules/.bin/tsx scripts/run-scheduled-imports.ts
 * - Cron: 0 6 * * * (täglich 6:00 UTC)
 * - GitHub Actions: siehe .github/workflows/import-regulatory-data.yml
 */

import 'dotenv/config';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ImportResult {
  source: string;
  success: boolean;
  exitCode: number;
  duration: number;
  error?: string;
}

const SOURCES = [
  { name: 'FDA 510(k)', script: 'import-fda-510k.ts', critical: false },
  { name: 'EMA News', script: 'import-ema-news.ts', critical: true },
  { name: 'WHO Guidance', script: 'import-who-guidance.ts', critical: false },
  { name: 'MHRA Updates', script: 'import-mhra-updates.ts', critical: true },
  { name: 'Health Canada', script: 'import-healthcanada-notices.ts', critical: true },
  { name: 'TGA Australia', script: 'import-tga-updates.ts', critical: false },
  { name: 'PMDA Japan', script: 'import-pmda-announcements.ts', critical: false },
];

function runImport(scriptPath: string): Promise<ImportResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const scriptName = path.basename(scriptPath, '.ts');

    // Platform-aware TSX execution
    const isWindows = process.platform === 'win32';
    const tsxBin = isWindows
      ? path.join(__dirname, '..', 'node_modules', '.bin', 'tsx.cmd')
      : path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');

    console.log(`[${new Date().toISOString()}] Starting: ${scriptName}`);

    const proc = spawn(tsxBin, [scriptPath], {
      stdio: 'pipe',
      shell: isWindows,
      timeout: 120000, // 2 min timeout
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;

      console.log(`[${new Date().toISOString()}] Finished: ${scriptName} (${duration}ms, exit=${code})`);
      if (stdout.trim()) console.log(`  Output: ${stdout.trim()}`);
      if (stderr.trim()) console.error(`  Error: ${stderr.trim()}`);

      resolve({
        source: scriptName,
        success,
        exitCode: code || 0,
        duration,
        error: success ? undefined : stderr || 'Unknown error',
      });
    });

    proc.on('error', (err) => {
      const duration = Date.now() - startTime;
      console.error(`[${new Date().toISOString()}] Error: ${scriptName} - ${err.message}`);
      resolve({
        source: scriptName,
        success: false,
        exitCode: -1,
        duration,
        error: err.message,
      });
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  HELIX Regulatory Import Scheduler');
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════\n');

  const results: ImportResult[] = [];
  const startTime = Date.now();

  // Sequential execution to avoid DB connection overload
  for (const source of SOURCES) {
    const scriptPath = path.join(__dirname, source.script);
    const result = await runImport(scriptPath);
    results.push(result);

    // Brief pause between imports
    await new Promise(r => setTimeout(r, 1000));
  }

  const totalDuration = Date.now() - startTime;
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const criticalFailed = results.filter(r => !r.success && SOURCES.find(s => s.script === `${r.source}.ts`)?.critical).length;

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Import Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`Successful: ${successful}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);
  if (criticalFailed > 0) {
    console.error(`⚠️  Critical Failures: ${criticalFailed}`);
  }
  console.log('\nDetailed Results:');

  results.forEach(r => {
    const status = r.success ? '✓' : '✗';
    const critical = SOURCES.find(s => s.script === `${r.source}.ts`)?.critical ? '[CRITICAL]' : '';
    console.log(`  ${status} ${r.source} ${critical} (${r.duration}ms, exit=${r.exitCode})`);
    if (r.error) {
      console.log(`    Error: ${r.error.substring(0, 200)}`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════\n');

  // Exit with error if critical sources failed
  if (criticalFailed > 0) {
    console.error('Critical import failures detected. Exiting with code 1.');
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal scheduler error:', err);
  process.exit(1);
});
