/**
 * Fügt fehlende hashedTitle Werte hinzu
 *
 * Für alle regulatory_updates Einträge ohne hashedTitle:
 * - Berechnet SHA256 Hash vom normalisierten Titel
 * - Aktualisiert den Eintrag
 *
 * Nutzung:
 *   npx tsx scripts/add-missing-hashes.ts
 */

import 'dotenv/config';
import crypto from 'node:crypto';
import { getScriptDb } from './script-db.js';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL fehlt');
    process.exit(1);
  }

  const { sql, db, driver } = getScriptDb();
  console.log(`[DB] add-missing-hashes using driver=${driver}`);

  // Finde alle Einträge ohne hashedTitle
  console.log('🔍 Suche Einträge ohne hashedTitle...\n');

  const entriesWithoutHash = await sql`
    SELECT id, title
    FROM regulatory_updates
    WHERE hashed_title IS NULL
    AND title IS NOT NULL
  `;

  if (entriesWithoutHash.length === 0) {
    console.log('✅ Alle Einträge haben bereits hashedTitle Werte!');
    process.exit(0);
  }

  console.log(`📦 Gefunden: ${entriesWithoutHash.length} Einträge ohne Hash\n`);

  let updated = 0;

  for (const entry of entriesWithoutHash) {
    try {
      const normalizedTitle = entry.title.toLowerCase().trim();
      const hash = crypto.createHash('sha256').update(normalizedTitle).digest('hex');

      await sql`
        UPDATE regulatory_updates
        SET hashed_title = ${hash}
        WHERE id = ${entry.id}
      `;

      updated++;

      if (updated % 10 === 0) {
        console.log(`   ✅ ${updated} / ${entriesWithoutHash.length} aktualisiert...`);
      }
    } catch (error) {
      console.error(`   ⚠️  Fehler bei ${entry.id}:`, error);
    }
  }

  console.log(`\n✅ Fertig: ${updated} hashedTitle Werte hinzugefügt`);
  console.log(`\n💡 Führe jetzt aus: npx tsx scripts/remove-duplicates.ts --dry-run`);

  process.exit(0);
}

main();
