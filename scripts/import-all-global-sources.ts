/**
 * Aggregierter Multi-Source Import Runner.
 * Führt sequentiell definierte Adapter aus und protokolliert Ergebnisse.
 * Nutzung: npx tsx scripts/import-all-global-sources.ts --limit=20
 */
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface SourceScript { name: string; file: string; args?: string[]; }

const sources: SourceScript[] = [
  { name: 'FDA 510k', file: 'scripts/import-fda-510k.ts', args: ['--limit=30'] },
  { name: 'EMA News', file: 'scripts/import-ema-news.ts', args: ['--limit=20'] },
  { name: 'WHO Guidance', file: 'scripts/import-who-guidance.ts' },
  { name: 'MHRA Updates', file: 'scripts/import-mhra-updates.ts' },
  { name: 'Health Canada Notices', file: 'scripts/import-healthcanada-notices.ts' },
  { name: 'TGA Updates', file: 'scripts/import-tga-updates.ts' },
  { name: 'PMDA Announcements', file: 'scripts/import-pmda-announcements.ts' },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tsxBin = process.platform === 'win32'
  ? path.join(__dirname, '..', 'node_modules', '.bin', 'tsx.cmd')
  : path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');

async function runScript(src: SourceScript): Promise<number> {
  return new Promise((resolve) => {
    console.log(`\n▶ Starte ${src.name}`);
    const child = spawn(tsxBin, [src.file, ...(src.args||[]) ], { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('exit', (code) => {
      console.log(`⏹ Ende ${src.name} ExitCode=${code}`);
      resolve(code ?? 0);
    });
  });
}

async function main() {
  const start = Date.now();
  console.log(`🌐 Global Import gestartet (${new Date().toISOString()})`);
  let failures = 0;
  for (const s of sources) {
    const code = await runScript(s);
    if (code !== 0) failures++;
  }
  const durationSec = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Alle Quellen verarbeitet (Dauer ${durationSec}s, Fehler ${failures})`);
  console.log(`🖥️ Host: ${os.hostname()} Mem: ${Math.round(process.memoryUsage().rss/1024/1024)}MB`);
  if (failures > 0) process.exitCode = 1;
}

// Unterstützt sowohl direkte Ausführung als auch programmatic require
if (import.meta.url === `file://${__filename}`) {
  main();
}
