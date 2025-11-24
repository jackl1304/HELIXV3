/**
 * Führt eine manuelle SQL-Migrationsdatei gegen die Postgres DB aus.
 * Nutzung: npx tsx scripts/run-manual-migration.ts migrations/20251123_regulatory_core.sql
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Pfad zur SQL-Datei fehlt');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL nicht gesetzt');
    process.exit(1);
  }
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error('Datei nicht gefunden:', abs);
    process.exit(1);
  }
  const sqlText = fs.readFileSync(abs, 'utf8');
  const statements = sqlText.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
  const sql = neon(process.env.DATABASE_URL);
  console.log(`🚀 Starte Migration ${path.basename(abs)} mit ${statements.length} Statements`);
  for (const stmt of statements) {
    try {
      await sql(stmt);
      console.log('✅ OK:', stmt.slice(0, 60).replace(/\s+/g,' '));
    } catch (e:any) {
      console.error('❌ Fehler Statement:', stmt.slice(0,80));
      console.error(e.message);
    }
  }
  console.log('🏁 Migration abgeschlossen');
}

main().catch(e => {
  console.error('💥 Unerwarteter Fehler:', e);
  process.exit(1);
});
