import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import SftpClient from 'ssh2-sftp-client';
import { globby } from 'globby';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function readJson<T = any>(p: string): Promise<T> {
  const raw = await fs.readFile(p, 'utf-8');
  return JSON.parse(raw) as T;
}

async function pathExists(p: string) {
  try { await fs.access(p); return true; } catch { return false; }
}

function toPosix(p: string) {
  return p.split(path.sep).join('/');
}

async function ensureRemoteDir(sftp: SftpClient, remoteDir: string) {
  const parts = remoteDir.split('/').filter(Boolean);
  let acc = remoteDir.startsWith('/') ? '/' : '';
  for (const part of parts) {
    acc = acc ? `${acc.replace(/\/$/, '')}/${part}` : part;
    // exists() returns false, 'd' for dir, '-' for file
    try {
      const exists = await sftp.exists(acc);
      if (!exists) {
        await sftp.mkdir(acc, true);
      } else if (exists !== 'd') {
        throw new Error(`Remote path is not a directory: ${acc}`);
      }
    } catch (e: any) {
      // Wenn Verzeichnis schon existiert oder Permission Denied, versuchen wir trotzdem Upload
      if (!e.message?.includes('permission denied') && !e.message?.includes('exists')) {
        throw e;
      }
    }
  }
}

async function main() {
  const sftpConfigPath = path.resolve(projectRoot, '.vscode', 'sftp.json');
  if (!(await pathExists(sftpConfigPath))) {
    console.error(`❌ Keine SFTP-Konfiguration gefunden: ${sftpConfigPath}`);
    console.error('Lege `.vscode/sftp.json` an oder nutze die vorhandene `.vscode/sftp.sample.json`.');
    process.exit(1);
  }

  type SftpCfg = {
    host: string; username: string; port?: number; protocol?: string;
    remotePath: string; privateKeyPath?: string; passphrase?: string; password?: string;
    ignore?: string[];
  };

  const cfg = await readJson<SftpCfg>(sftpConfigPath);
  if (!cfg.host || !cfg.username || !cfg.remotePath) {
    throw new Error('Ungültige SFTP-Konfiguration: host, username, remotePath sind Pflichtfelder.');
  }
  let privateKey: Buffer | undefined;
  let passphrase: string | undefined;
  if (cfg.privateKeyPath) {
    const keyPath = cfg.privateKeyPath.replace('~', process.env.HOME || process.env.USERPROFILE || '');
    try {
      privateKey = await fs.readFile(keyPath);
    } catch (e) {
      if (!cfg.password) {
        throw new Error(`SSH-Key nicht gefunden (${keyPath}). Entweder Key bereitstellen oder temporär Passwort in .vscode/sftp.json setzen.`);
      }
    }
    passphrase = (cfg.passphrase && cfg.passphrase.startsWith('${env:'))
      ? process.env[cfg.passphrase.slice(6, -1)]
      : cfg.passphrase;
  }

  const distDir = path.resolve(projectRoot, 'dist');
  if (!(await pathExists(distDir))) {
    console.error('❌ Build-Ordner `dist/` nicht gefunden. Bitte zuerst `npm run build` ausführen.');
    process.exit(1);
  }

  const rawIgnore = (cfg.ignore && cfg.ignore.length ? cfg.ignore : ['**/.DS_Store']);
  // Filter "dist"-Ignorierregeln heraus, damit Deploy nicht alles ausschließt
  const ignoreGlobs = rawIgnore.filter((p) => {
    const clean = p.replace(/^\.\/?/, '');
    if (clean === 'dist' || clean === '/dist' || clean.startsWith('dist/') || clean.startsWith('/dist/')) return false;
    if (clean === '**/dist' || clean.startsWith('**/dist/')) return false;
    return true;
  });

  const files = await globby(['dist/**', '!dist/**/*.map'], {
    cwd: projectRoot,
    onlyFiles: true,
    dot: false,
    ignore: ignoreGlobs.map(g => g.startsWith('dist') ? g : `dist/${g}`),
  });

  if (!files.length) {
    console.log('ℹ️ Keine Dateien in `dist/` zum Upload gefunden.');
    return;
  }

  const client = new SftpClient();
  const remoteBase = cfg.remotePath.endsWith('/') ? cfg.remotePath.slice(0, -1) : cfg.remotePath;

  console.log(`🚀 Starte SFTP Upload -> ${cfg.username}@${cfg.host}:${cfg.port ?? 22}${remoteBase}`);
  try {
    await client.connect({
      host: cfg.host,
      username: cfg.username,
      port: cfg.port ?? 22,
      privateKey,
      passphrase,
      password: privateKey ? undefined : cfg.password,
      readyTimeout: 20000,
    } as any);

    // Upload mit kleiner Parallelität
    const concurrency = 6;
    let inFlight = 0;
    let idx = 0;
    let uploaded = 0;

    await new Promise<void>((resolve, reject) => {
      const next = () => {
        if (idx >= files.length && inFlight === 0) return resolve();
        while (inFlight < concurrency && idx < files.length) {
          const rel = files[idx++];
          inFlight++;
          (async () => {
            try {
              const local = path.resolve(projectRoot, rel);
              const relFromDist = toPosix(path.relative(distDir, local));
              const remotePath = `${remoteBase}/${relFromDist}`.replace(/\\/g, '/');
              const remoteDir = remotePath.split('/').slice(0, -1).join('/');
              await ensureRemoteDir(client, remoteDir);
              await client.fastPut(local, remotePath);
              uploaded++;
              if (uploaded % 25 === 0 || uploaded === files.length) {
                console.log(`… ${uploaded}/${files.length} hochgeladen`);
              }
            } catch (e) {
              reject(e);
              return;
            } finally {
              inFlight--;
              next();
            }
          })();
        }
      };
      next();
    });

    console.log(`✅ Upload abgeschlossen: ${uploaded} Dateien.`);
  } catch (err) {
    console.error('❌ Upload fehlgeschlagen:', (err as Error).message);
    process.exit(1);
  } finally {
    try { await client.end(); } catch {}
  }
}

main().catch((e) => {
  console.error('❌ Unerwarteter Fehler:', e);
  process.exit(1);
});
