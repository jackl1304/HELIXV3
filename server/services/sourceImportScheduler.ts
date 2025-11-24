import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

let running = false;
let lastRunStart: Date | null = null;
let lastRunEnd: Date | null = null;
let lastExitCode: number | null = null;

export interface SchedulerOptions {
  intervalMs?: number; // default 30min
}

const scriptNames = [
  'import-fda-510k',
  'import-ema-news',
  'import-who-guidance',
  'import-mhra-updates',
  'import-healthcanada-notices',
  'import-tga-updates',
  'import-pmda-announcements'
];

function getScriptPath(baseDir: string, name: string) {
  const full = path.join(baseDir, 'dist', 'import-scripts', `${name}.js`);
  return full;
}

async function runSequentialScripts(): Promise<number> {
  const baseDir = process.cwd();
  let failures = 0;
  for (const name of scriptNames) {
    const scriptPath = getScriptPath(baseDir, name);
    if (!fs.existsSync(scriptPath)) {
      console.warn(`[SCHED] Script fehlt: ${scriptPath}`);
      failures++;
      continue;
    }
    console.log(`[SCHED] ▶ Starte ${name}`);
    const exitCode: number = await new Promise(resolve => {
      const child = spawn(process.execPath, [scriptPath], { stdio: 'inherit' });
      child.on('exit', code => resolve(code ?? 0));
      child.on('error', err => { console.error(`[SCHED] Fehler Spawn ${name}:`, err.message); resolve(1); });
    });
    console.log(`[SCHED] ⏹ Ende ${name} Code=${exitCode}`);
    if (exitCode !== 0) failures++;
  }
  return failures;
}

export async function runImmediateImportCycle() {
  if (running) {
    console.log('[SCHED] Zyklus bereits aktiv');
    return;
  }
  running = true;
  lastRunStart = new Date();
  console.log(`[SCHED] Manueller Import-Zyklus gestartet @ ${lastRunStart.toISOString()}`);
  const failures = await runSequentialScripts();
  lastRunEnd = new Date();
  lastExitCode = failures === 0 ? 0 : 1;
  running = false;
  console.log(`[SCHED] Manueller Import-Zyklus beendet Fehler=${failures} Dauer=${((lastRunEnd.getTime()-lastRunStart.getTime())/1000).toFixed(1)}s`);
}

export function startSourceImportScheduler(opts: SchedulerOptions = {}) {
  const interval = opts.intervalMs ?? (parseInt(process.env.IMPORT_INTERVAL_MINUTES || '30', 10) * 60 * 1000);
  console.log(`[SCHED] SourceImportScheduler aktiv – Intervall ${Math.round(interval/60000)} Minuten`);
  const tick = async () => {
    if (running) {
      console.log('[SCHED] Skip – Import noch aktiv');
      return;
    }
    running = true;
    lastRunStart = new Date();
    console.log(`[SCHED] Starte Import-Zyklus @ ${lastRunStart.toISOString()}`);
    const failures = await runSequentialScripts();
    lastRunEnd = new Date();
    lastExitCode = failures === 0 ? 0 : 1;
    running = false;
    console.log(`[SCHED] Import-Zyklus beendet Fehler=${failures} Dauer=${((lastRunEnd.getTime()-lastRunStart!.getTime())/1000).toFixed(1)}s`);
  };
  // Sofortiger erster Lauf (deaktivierbar über SKIP_INITIAL_IMPORT)
  if (process.env.SKIP_INITIAL_IMPORT !== '1') {
    setTimeout(() => {
      tick().catch(err => console.error('[SCHED] Initial import error:', err));
    }, 250);
  }
  return setInterval(() => {
    tick().catch(err => console.error('[SCHED] Interval import error:', err));
  }, interval);
}

export function getSchedulerStatus() {
  return {
    running,
    lastRunStart,
    lastRunEnd,
    lastExitCode,
    intervalMinutes: parseInt(process.env.IMPORT_INTERVAL_MINUTES || '30', 10)
  };
}
