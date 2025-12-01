/**
 * Duplikat-Bereinigung für regulatory_updates
 *
 * Strategie:
 * 1. Findet Duplikate basierend auf hashedTitle
 * 2. Behält den ÄLTESTEN Eintrag (created_at ASC)
 * 3. Löscht alle neueren Duplikate
 *
 * Nutzung:
 *   npx tsx scripts/remove-duplicates.ts --dry-run    # Vorschau ohne Löschen
 *   npx tsx scripts/remove-duplicates.ts              # Tatsächliches Löschen
 */

import 'dotenv/config';
import { getScriptDb } from './script-db.js';

interface DuplicateGroup {
  hashedTitle: string;
  count: number;
  ids: string[];
  titles: string[];
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run')
  };
}

async function findDuplicates(sql: any): Promise<DuplicateGroup[]> {
  console.log('🔍 Suche nach Duplikaten basierend auf hashedTitle...\n');

  // Finde alle hashedTitle Werte mit mehr als einem Eintrag
  const duplicateHashes = await sql`
    SELECT
      hashed_title,
      COUNT(*) as count,
      ARRAY_AGG(id ORDER BY created_at ASC) as ids,
      ARRAY_AGG(title ORDER BY created_at ASC) as titles
    FROM regulatory_updates
    WHERE hashed_title IS NOT NULL
    GROUP BY hashed_title
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `;

  return duplicateHashes.map((row: any) => ({
    hashedTitle: row.hashed_title,
    count: parseInt(row.count),
    ids: row.ids,
    titles: row.titles
  }));
}

async function removeDuplicates(sql: any, duplicates: DuplicateGroup[], dryRun: boolean) {
  let totalToDelete = 0;
  let totalDeleted = 0;

  console.log(`\n📊 Gefunden: ${duplicates.length} Duplikat-Gruppen\n`);

  for (const dup of duplicates) {
    const [keepId, ...deleteIds] = dup.ids;
    const [keepTitle] = dup.titles;

    totalToDelete += deleteIds.length;

    console.log(`\n📝 Gruppe mit ${dup.count} Duplikaten:`);
    console.log(`   Titel: "${keepTitle.substring(0, 80)}${keepTitle.length > 80 ? '...' : ''}"`);
    console.log(`   ✅ Behalten: ${keepId} (ältester Eintrag)`);
    console.log(`   ❌ Löschen: ${deleteIds.length} neuere Duplikate`);

    if (!dryRun) {
      try {
        // Lösche alle Duplikate außer dem ältesten
        for (const id of deleteIds) {
          await sql`DELETE FROM regulatory_updates WHERE id = ${id}`;
          totalDeleted++;
          console.log(`      🗑️  Gelöscht: ${id}`);
        }
      } catch (error) {
        console.error(`   ⚠️  Fehler beim Löschen:`, error);
      }
    } else {
      console.log(`   [DRY-RUN] Würde ${deleteIds.length} Einträge löschen`);
    }
  }

  return { totalToDelete, totalDeleted };
}

async function findDuplicatesByFields(sql: any): Promise<any[]> {
  console.log('\n🔍 Suche nach Duplikaten basierend auf title + sourceId...\n');

  const titleDuplicates = await sql`
    SELECT
      title,
      source_id,
      COUNT(*) as count,
      ARRAY_AGG(id ORDER BY created_at ASC) as ids
    FROM regulatory_updates
    WHERE title IS NOT NULL
    GROUP BY title, source_id
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
    LIMIT 50
  `;

  return titleDuplicates;
}

async function main() {
  const { dryRun } = parseArgs();

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL fehlt');
    process.exit(1);
  }

  const { sql, db, driver } = getScriptDb();
  console.log(`[DB] remove-duplicates using driver=${driver}`);

  if (dryRun) {
    console.log('\n⚠️  DRY-RUN MODE: Keine Änderungen werden vorgenommen\n');
  }

  // 1. Duplikate via hashedTitle finden
  const duplicatesByHash = await findDuplicates(sql);

  if (duplicatesByHash.length === 0) {
    console.log('✅ Keine Duplikate basierend auf hashedTitle gefunden!');
  } else {
    const { totalToDelete, totalDeleted } = await removeDuplicates(sql, duplicatesByHash, dryRun);

    console.log('\n' + '='.repeat(60));
    if (dryRun) {
      console.log(`📊 DRY-RUN Zusammenfassung:`);
      console.log(`   Würde ${totalToDelete} Duplikate aus ${duplicatesByHash.length} Gruppen löschen`);
      console.log(`\n💡 Führe ohne --dry-run aus um tatsächlich zu löschen`);
    } else {
      console.log(`✅ Bereinigung abgeschlossen:`);
      console.log(`   ${totalDeleted} von ${totalToDelete} Duplikaten gelöscht`);
    }
  }

  // 2. Zusätzliche Prüfung: Duplikate via title + source_id
  const titleDuplicates = await findDuplicatesByFields(sql);

  if (titleDuplicates.length > 0) {
    console.log(`\n⚠️  Warnung: ${titleDuplicates.length} Duplikate ohne hashedTitle gefunden`);
    console.log(`   Diese haben denselben Titel + Quelle, aber keinen Hash`);
    console.log(`   Ersten 5 Beispiele:\n`);

    for (const dup of titleDuplicates.slice(0, 5)) {
      console.log(`   - "${dup.title.substring(0, 60)}..."`);
      console.log(`     Source: ${dup.source_id}, Count: ${dup.count}`);
      console.log(`     IDs: ${dup.ids.join(', ')}\n`);
    }

    console.log(`💡 Tipp: Diese Einträge sollten hashedTitle Werte bekommen`);
    console.log(`   Führe aus: npx tsx scripts/add-missing-hashes.ts`);
  }

  process.exit(0);
}

main();
